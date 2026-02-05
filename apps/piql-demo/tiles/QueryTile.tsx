import { DataFrameTable } from "query-viz";
import { Show } from "solid-js";
import { usePaneId, type TileSpec } from "workbench";
import { usePiqlClient } from "../piql";
import {
  getQueryState,
  setQueryLoading,
  setQueryResult,
  setQueryText,
} from "../queryStore";

export const queryTile = (): TileSpec => ({
  id: "query",
  title: "Query",
  component: QueryContent,
});

function QueryContent() {
  const client = usePiqlClient();
  const paneId = usePaneId();

  // Get reactive state from store
  const state = () => getQueryState(paneId);

  const submit = async () => {
    const q = state().queryText.trim();
    if (!q) return;

    setQueryLoading(paneId, true);

    try {
      const result = await client.query(q);
      setQueryResult(paneId, result, null);
    } catch (e) {
      setQueryResult(paneId, null, e instanceof Error ? e : new Error(String(e)));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div class="h-full flex flex-col">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700"
      >
        <input
          type="text"
          value={state().queryText}
          onInput={(e) => setQueryText(paneId, e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter query..."
          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={state().loading}
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors"
        >
          {state().loading ? "..." : "Run"}
        </button>
      </form>

      <div class="flex-1 overflow-hidden">
        <Show when={state().error}>
          <div class="p-3 text-sm text-red-600 dark:text-red-400">
            {state().error!.message}
          </div>
        </Show>

        <Show when={state().table}>
          <DataFrameTable
            table={() => state().table}
            config={{
              stripedRows: true,
              density: "compact",
            }}
            class="h-full"
          />
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
