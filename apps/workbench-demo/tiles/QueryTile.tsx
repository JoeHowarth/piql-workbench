import type { Table } from "apache-arrow";
import { DataFrameTable } from "query-viz";
import { createSignal, onCleanup, Show } from "solid-js";
import type { TileSpec } from "workbench";
import { usePiqlClient } from "../piql";

export const queryTile = (): TileSpec => ({
  id: "query",
  title: "Query",
  component: QueryContent,
});

function QueryContent() {
  const client = usePiqlClient();

  const [queryText, setQueryText] = createSignal("");
  const [table, setTable] = createSignal<Table | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);
  let requestToken = 0;
  let activeController: AbortController | null = null;

  const beginRequest = () => {
    requestToken += 1;
    activeController?.abort();
    activeController = new AbortController();
    return {
      token: requestToken,
      signal: activeController.signal,
    };
  };

  const isCurrent = (token: number) => token === requestToken;

  const submit = async () => {
    const q = queryText().trim();
    if (!q) return;

    const { token, signal } = beginRequest();
    setLoading(true);
    setError(null);

    try {
      const result = await client.query(q, signal);
      if (!isCurrent(token)) return;
      setTable(() => result);
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError")
      ) {
        if (isCurrent(token)) {
          setLoading(false);
        }
        return;
      }
      if (!isCurrent(token)) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setTable(null);
    } finally {
      if (isCurrent(token)) {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  onCleanup(() => {
    activeController?.abort();
  });

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
          value={queryText()}
          onInput={(e) => setQueryText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter query..."
          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading()}
          class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors"
        >
          {loading() ? "..." : "Run"}
        </button>
      </form>

      <div class="flex-1 overflow-hidden">
        <Show when={error()}>
          <div class="p-3 text-sm text-red-600 dark:text-red-400">
            {error()!.message}
          </div>
        </Show>

        <Show when={table()}>
          <DataFrameTable
            table={table}
            config={{
              stripedRows: true,
              density: "compact",
            }}
            class="h-full"
          />
        </Show>

        <Show when={!table() && !error() && !loading()}>
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Enter a query and press Run
          </div>
        </Show>
      </div>
    </div>
  );
}
