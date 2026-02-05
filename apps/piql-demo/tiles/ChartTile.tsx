import {
  BarChart,
  type BarChartConfig,
  isNumericType,
  useArrowData,
} from "query-viz";
import { createMemo, Show } from "solid-js";
import { type TileSpec, usePaneId } from "workbench";
import {
  getChartState,
  setChartLoading,
  setChartQuery,
  setChartResult,
} from "../chartStore";
import { CodeInput } from "../components/CodeInput";
import { client } from "../piql";

export const chartTile = (): TileSpec => ({
  id: "chart",
  title: "Chart",
  component: ChartContent,
});

function ChartContent() {
  const paneId = usePaneId();
  const state = () => getChartState(paneId);

  const submit = async () => {
    const q = state().queryText.trim();
    if (!q) return;

    setChartLoading(paneId, true);
    console.log("[ChartTile] Submitting query:", q);

    try {
      const result = await client.query(q);
      console.log("[ChartTile] Got result:", result);
      console.log("[ChartTile] Result numRows:", result?.numRows);
      console.log("[ChartTile] Result schema:", result?.schema?.fields?.map((f: { name: string; type: unknown }) => ({ name: f.name, type: String(f.type) })));
      setChartResult(paneId, result, null);
    } catch (e) {
      console.error("[ChartTile] Query error:", e);
      setChartResult(
        paneId,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  // Parse the Arrow table to get schema
  const arrowData = useArrowData(() => state().table);

  // Debug: log when arrowData changes
  createMemo(() => {
    console.log("[ChartTile] arrowData.schema:", arrowData.schema);
    console.log("[ChartTile] arrowData.rows.length:", arrowData.rows.length);
  });

  // Auto-infer chart config from schema
  const chartConfig = createMemo((): BarChartConfig | null => {
    const { schema } = arrowData;
    console.log("[ChartTile] chartConfig memo running, schema:", schema);
    if (schema.length === 0) {
      console.log("[ChartTile] No schema, returning null config");
      return null;
    }

    // Find first string column for category axis
    // Arrow can encode strings as Utf8, LargeUtf8, or Dictionary<..., Utf8>
    const categoryCol = schema.find(
      (col) =>
        col.type === "Utf8" ||
        col.type === "LargeUtf8" ||
        col.type.includes("Utf8"),
    );
    // Find first numeric column for value
    const valueCol = schema.find((col) => isNumericType(col.type));

    console.log("[ChartTile] categoryCol:", categoryCol);
    console.log("[ChartTile] valueCol:", valueCol);

    if (!categoryCol || !valueCol) {
      console.log("[ChartTile] Missing category or value col, returning null");
      return null;
    }

    const config = {
      categoryAxis: { column: categoryCol.name },
      series: [{ column: valueCol.name }],
    };
    console.log("[ChartTile] Generated config:", config);
    return config;
  });

  return (
    <div class="h-full grid grid-rows-[auto_1fr]">
      <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <CodeInput
          value={state().queryText}
          onChange={(v) => setChartQuery(paneId, v)}
          onSubmit={submit}
          class="flex-1 min-h-[32px]"
        />
        <button
          type="button"
          disabled={state().loading}
          onClick={submit}
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors self-start"
        >
          {state().loading ? "..." : "Run"}
        </button>
      </div>

      <div class="relative overflow-hidden">
        <Show when={state().error}>
          <div class="p-3 text-sm text-red-600 dark:text-red-400">
            {state().error!.message}
          </div>
        </Show>

        <Show when={state().table && chartConfig()}>
          <BarChart
            table={() => state().table}
            config={chartConfig()!}
          />
        </Show>

        <Show when={state().table && !chartConfig()}>
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            No chartable columns (need a string + numeric column)
          </div>
        </Show>

        <Show when={!state().table && !state().error && !state().loading}>
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Enter a query and press Run
          </div>
        </Show>
      </div>
    </div>
  );
}
