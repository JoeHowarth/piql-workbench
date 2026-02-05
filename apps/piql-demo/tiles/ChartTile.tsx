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

    try {
      const result = await client.query(q);
      setChartResult(paneId, result, null);
    } catch (e) {
      setChartResult(
        paneId,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  // Parse the Arrow table to get schema
  const arrowData = useArrowData(() => state().table);

  // Auto-infer chart config from schema
  const chartConfig = createMemo((): BarChartConfig | null => {
    const { schema } = arrowData;
    if (schema.length === 0) return null;

    // Find first string column for category axis
    const categoryCol = schema.find(
      (col) => col.type === "Utf8" || col.type === "LargeUtf8",
    );
    // Find first numeric column for value
    const valueCol = schema.find((col) => isNumericType(col.type));

    if (!categoryCol || !valueCol) return null;

    return {
      categoryAxis: { column: categoryCol.name },
      series: [{ column: valueCol.name }],
    };
  });

  return (
    <div class="h-full flex flex-col">
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

      <div class="flex-1 overflow-hidden">
        <Show when={state().error}>
          <div class="p-3 text-sm text-red-600 dark:text-red-400">
            {state().error!.message}
          </div>
        </Show>

        <Show when={state().table && chartConfig()}>
          <BarChart
            table={() => state().table}
            config={chartConfig()!}
            class="h-full"
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
