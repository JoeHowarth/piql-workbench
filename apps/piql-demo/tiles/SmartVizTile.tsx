import {
  BarChart,
  type BarChartConfig,
  DataFrameTable,
  LineChart,
  type LineChartConfig,
  ScatterChart,
  type ScatterChartConfig,
  isNumericType,
  isTemporalType,
  useArrowData,
} from "query-viz";
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js";
import { type TileSpec, useFocusMode, usePaneId, useWorkbench } from "workbench";
import {
  type VizType,
  getSmartVizState,
  setSmartVizGeneratedQuery,
  setSmartVizLoading,
  setSmartVizQuestion,
  setSmartVizResult,
  setVizType,
} from "../smartVizStore";
import { CodeInput } from "../components/CodeInput";
import { client } from "../piql";

export const smartVizTile = (): TileSpec => ({
  id: "smartviz",
  title: "SmartViz",
  component: SmartVizContent,
});

const VIZ_TYPES: { id: VizType; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "scatter", label: "Scatter" },
];

const PROMPT_PREFIXES: Record<VizType, string> = {
  table: "",
  bar: "IMPORTANT: The result must have exactly 2 columns - one string/categorical column for labels and one numeric column for values. Use group_by() with an aggregation if needed.",
  line: "IMPORTANT: The result must have a temporal or sequential numeric column for the x-axis and one or more numeric columns for y values. Order by the x column.",
  scatter: "IMPORTANT: The result must have 2-3 numeric columns for x, y, and optionally size dimensions. Return individual data points, not aggregations.",
};

/** Format first N rows of table as text for context */
function formatSampleRows(table: import("apache-arrow").Table, n = 5): string {
  const cols = table.schema.fields.map((f) => f.name);
  const rows: string[] = [cols.join("\t")];
  const len = Math.min(n, table.numRows);
  for (let i = 0; i < len; i++) {
    const row = cols.map((col) => String(table.getChild(col)?.get(i) ?? ""));
    rows.push(row.join("\t"));
  }
  return rows.join("\n");
}

function SmartVizContent() {
  const paneId = usePaneId();
  const { addTile } = useWorkbench();
  const state = () => getSmartVizState(paneId);

  const duplicate = () => {
    const s = state();
    addTile("smartviz", paneId, "bottom", {
      vizType: s.vizType,
      question: s.question,
      query: s.generatedQuery,
      table: s.table,
    });
  };

  const [refinement, setRefinement] = createSignal("");
  const focusMode = useFocusMode();

  const submitRefinement = async () => {
    const r = refinement().trim();
    if (!r) return;

    const s = state();
    if (!s.table) return;

    setSmartVizLoading(paneId, true);

    try {
      // Build context from previous state
      const sampleRows = formatSampleRows(s.table, 5);
      const context = `Previous question: ${s.question}
Generated PiQL query: ${s.generatedQuery}
Result sample (first 5 rows):
${sampleRows}

User's follow-up request: ${r}`;

      const prefix = PROMPT_PREFIXES[s.vizType];
      const fullQuestion = prefix ? `${prefix}\n\n${context}` : context;

      // Step 1: Get the generated query (no execution)
      const { query } = await client.ask(fullQuestion, false);
      setSmartVizGeneratedQuery(paneId, query);
      setSmartVizQuestion(paneId, r);

      // Step 2: Execute the query separately
      const table = await client.query(query);
      setSmartVizResult(paneId, query, table, null);
      setRefinement("");
    } catch (e) {
      // Query is already set, just show the error
      setSmartVizResult(
        paneId,
        state().generatedQuery,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  const submitQuestion = async () => {
    const q = state().question.trim();
    if (!q) return;

    setSmartVizLoading(paneId, true);

    try {
      const prefix = PROMPT_PREFIXES[state().vizType];
      const fullQuestion = prefix ? `${prefix}\n\nUser question: ${q}` : q;

      // Step 1: Get the generated query (no execution)
      const { query } = await client.ask(fullQuestion, false);
      setSmartVizGeneratedQuery(paneId, query);

      // Step 2: Execute the query separately
      const table = await client.query(query);
      setSmartVizResult(paneId, query, table, null);
    } catch (e) {
      // Query is already set, just show the error
      setSmartVizResult(
        paneId,
        state().generatedQuery,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  const runQuery = async () => {
    const q = state().generatedQuery.trim();
    if (!q) return;

    setSmartVizLoading(paneId, true);

    try {
      const result = await client.query(q);
      setSmartVizResult(paneId, q, result, null);
    } catch (e) {
      setSmartVizResult(
        paneId,
        q,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  const arrowData = useArrowData(() => state().table);

  // Auto-config for bar chart
  const barConfig = createMemo((): BarChartConfig | null => {
    const { schema } = arrowData;
    if (schema.length === 0) return null;

    const categoryCol = schema.find(
      (col) =>
        col.type === "Utf8" ||
        col.type === "LargeUtf8" ||
        col.type.includes("Utf8"),
    );
    const valueCol = schema.find((col) => isNumericType(col.type));

    if (!categoryCol || !valueCol) return null;

    return {
      categoryAxis: { column: categoryCol.name },
      series: [{ column: valueCol.name }],
    };
  });

  // Auto-config for line chart
  const lineConfig = createMemo((): LineChartConfig | null => {
    const { schema } = arrowData;
    if (schema.length === 0) return null;

    const xCol =
      schema.find((col) => isTemporalType(col.type)) ||
      schema.find((col) => isNumericType(col.type));

    if (!xCol) return null;

    const yCols = schema.filter(
      (col) => col.name !== xCol.name && isNumericType(col.type),
    );

    if (yCols.length === 0) return null;

    return {
      xAxis: { column: xCol.name },
      series: yCols.map((col) => ({ column: col.name })),
      smooth: true,
    };
  });

  // Auto-config for scatter chart
  const scatterConfig = createMemo((): ScatterChartConfig | null => {
    const { schema } = arrowData;
    if (schema.length === 0) return null;

    const numericCols = schema.filter((col) => isNumericType(col.type));

    if (numericCols.length < 2) return null;

    const config: ScatterChartConfig = {
      dimensions: {
        x: numericCols[0].name,
        y: numericCols[1].name,
      },
    };

    if (numericCols.length >= 3) {
      config.dimensions.size = numericCols[2].name;
    }

    return config;
  });

  return (
    <div class="h-full flex flex-col">
      {/* Controls - hidden in focus mode */}
      <Show when={!focusMode}>
        {/* Viz type selector */}
        <div class="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
          <For each={VIZ_TYPES}>
            {(vt) => (
              <button
                type="button"
                onClick={() => setVizType(paneId, vt.id)}
                class={`px-3 py-1 text-sm rounded transition-colors ${
                  state().vizType === vt.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {vt.label}
              </button>
            )}
          </For>
          <div class="flex-1" />
          <button
            type="button"
            onClick={duplicate}
            class="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded transition-colors"
            title="Duplicate this tile"
          >
            <span>⧉</span>
            <span>Duplicate</span>
          </button>
        </div>

        {/* Question input */}
        <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
          <textarea
            value={state().question}
            onInput={(e) => {
              setSmartVizQuestion(paneId, e.currentTarget.value);
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitQuestion();
              }
            }}
            placeholder="Ask a question... (Enter to submit)"
            rows={1}
            class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
          />
          <button
            type="button"
            disabled={state().loading}
            onClick={submitQuestion}
            class="px-3 py-1 text-sm bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded transition-colors self-start"
          >
            {state().loading ? "..." : "Ask"}
          </button>
        </div>

        {/* Generated query (editable) - always visible */}
        <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <CodeInput
            value={state().generatedQuery}
            onChange={(v) => setSmartVizGeneratedQuery(paneId, v)}
            onSubmit={runQuery}
            class="flex-1 min-h-[32px]"
          />
          <button
            type="button"
            disabled={state().loading || !state().generatedQuery.trim()}
            onClick={runQuery}
            class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors self-start"
          >
            Run
          </button>
        </div>
      </Show>

      {/* Visualization */}
      <div class="flex-1 relative overflow-hidden">
        <Show when={state().error}>
          <div class="p-3 text-sm text-red-600 dark:text-red-400">
            {state().error!.message}
          </div>
        </Show>

        <Show when={state().table}>
          <Switch>
            <Match when={state().vizType === "table"}>
              <DataFrameTable
                table={() => state().table}
                config={{ stripedRows: true, density: "compact" }}
                class="h-full"
              />
            </Match>
            <Match when={state().vizType === "bar" && barConfig()}>
              <BarChart
                table={() => state().table}
                config={barConfig()!}
              />
            </Match>
            <Match when={state().vizType === "bar" && !barConfig()}>
              <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Need a string + numeric column for bar chart
              </div>
            </Match>
            <Match when={state().vizType === "line" && lineConfig()}>
              <LineChart
                table={() => state().table}
                config={lineConfig()!}
              />
            </Match>
            <Match when={state().vizType === "line" && !lineConfig()}>
              <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Need numeric columns for line chart
              </div>
            </Match>
            <Match when={state().vizType === "scatter" && scatterConfig()}>
              <ScatterChart
                table={() => state().table}
                config={scatterConfig()!}
              />
            </Match>
            <Match when={state().vizType === "scatter" && !scatterConfig()}>
              <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Need at least 2 numeric columns for scatter chart
              </div>
            </Match>
          </Switch>
        </Show>

        <Show when={!state().table && !state().error && !state().loading}>
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Enter a query or ask a question
          </div>
        </Show>
      </div>

      {/* Refinement input - appears when there are results (hidden in focus mode) */}
      <Show when={state().table && !state().loading && !focusMode}>
        <div class="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <textarea
            value={refinement()}
            onInput={(e) => {
              setRefinement(e.currentTarget.value);
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitRefinement();
              }
            }}
            placeholder="Refine: filter, group, add columns..."
            rows={1}
            class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none overflow-hidden"
          />
          <button
            type="button"
            disabled={state().loading || !refinement().trim()}
            onClick={submitRefinement}
            class="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded transition-colors self-start"
          >
            Refine
          </button>
        </div>
      </Show>

      </div>
  );
}
