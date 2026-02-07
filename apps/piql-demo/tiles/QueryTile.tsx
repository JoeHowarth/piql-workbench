import { DataFrameTable } from "query-viz";
import { Show } from "solid-js";
import { type TileSpec, usePaneId } from "workbench";
import { CodeInput } from "../components/CodeInput";
import { client } from "../piql";
import {
  getQueryState,
  setQueryLoading,
  setQueryResult,
  setQueryText,
} from "../queryStore";
import { createRequestController, isAbortError } from "../utils/requestControl";

export const queryTile = (): TileSpec => ({
  id: "query",
  title: "Query",
  component: QueryContent,
});

function QueryContent() {
  const paneId = usePaneId();
  const requests = createRequestController();

  // Get reactive state from store
  const state = () => getQueryState(paneId);

  const submit = async () => {
    const q = state().queryText.trim();
    if (!q) return;

    const { token, signal } = requests.begin();
    setQueryLoading(paneId, true);

    try {
      const result = await client.query(q, signal);
      if (!requests.isCurrent(token)) return;
      setQueryResult(paneId, result, null);
    } catch (e) {
      if (isAbortError(e)) {
        if (requests.isCurrent(token)) {
          setQueryLoading(paneId, false);
        }
        return;
      }
      if (!requests.isCurrent(token)) return;
      setQueryResult(
        paneId,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  return (
    <div class="h-full flex flex-col">
      <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <CodeInput
          value={state().queryText}
          onChange={(v) => setQueryText(paneId, v)}
          onSubmit={submit}
          testId="query-editor"
          inputTestId="query-editor-input"
          inputAriaLabel="Query editor"
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
