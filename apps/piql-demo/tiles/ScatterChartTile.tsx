import { useArrowData } from "query-viz";
import { createMemo, Show, Suspense } from "solid-js";
import { type TileSpec, usePaneId } from "workbench";
import { inferScatterChartConfig } from "../chartInference";
import { CodeInput } from "../components/CodeInput";
import { LazyScatterChart } from "../components/lazyCharts";
import { client } from "../piql";
import {
  getScatterState,
  setScatterLoading,
  setScatterQuery,
  setScatterResult,
} from "../scatterStore";

export const scatterChartTile = (): TileSpec => ({
  id: "scatter",
  title: "Scatter",
  component: ScatterChartContent,
});

function ScatterChartContent() {
  const paneId = usePaneId();
  const state = () => getScatterState(paneId);

  const submit = async () => {
    const q = state().queryText.trim();
    if (!q) return;

    setScatterLoading(paneId, true);

    try {
      const result = await client.query(q);
      setScatterResult(paneId, result, null);
    } catch (e) {
      setScatterResult(
        paneId,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  const arrowData = useArrowData(() => state().table);

  const chartConfig = createMemo(() =>
    inferScatterChartConfig(arrowData.schema),
  );

  return (
    <div class="h-full grid grid-rows-[auto_1fr]">
      <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <CodeInput
          value={state().queryText}
          onChange={(v) => setScatterQuery(paneId, v)}
          onSubmit={submit}
          testId="scatter-editor"
          inputTestId="scatter-editor-input"
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
          <Suspense
            fallback={
              <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Loading chart...
              </div>
            }
          >
            <LazyScatterChart
              table={() => state().table}
              config={chartConfig()!}
            />
          </Suspense>
        </Show>

        <Show when={state().table && !chartConfig()}>
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Need at least 2 numeric columns for scatter chart
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
