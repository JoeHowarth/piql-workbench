import { DataFrameTable } from "query-viz";
import { Show } from "solid-js";
import { type TileSpec, usePaneId } from "workbench";
import {
  getAskState,
  setAskLoading,
  setAskResult,
  setGeneratedQuery,
  setQuestion,
} from "../askStore";
import { CodeInput } from "../components/CodeInput";
import { client } from "../piql";

export const askTile = (): TileSpec => ({
  id: "ask",
  title: "Ask",
  component: AskContent,
});

function AskContent() {
  const paneId = usePaneId();
  const state = () => getAskState(paneId);

  // Submit natural language question
  const submitQuestion = async () => {
    const q = state().question.trim();
    if (!q) return;

    setAskLoading(paneId, true);

    try {
      const { query, table } = await client.ask(q, true);
      setAskResult(paneId, query, table ?? null, null);
    } catch (e) {
      setAskResult(
        paneId,
        "",
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  // Re-run the (possibly edited) generated query
  const runQuery = async () => {
    const q = state().generatedQuery.trim();
    if (!q) return;

    setAskLoading(paneId, true);

    try {
      const result = await client.query(q);
      setAskResult(paneId, q, result, null);
    } catch (e) {
      setAskResult(
        paneId,
        q,
        null,
        e instanceof Error ? e : new Error(String(e)),
      );
    }
  };

  return (
    <div class="h-full flex flex-col">
      {/* Question input */}
      <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
        <textarea
          value={state().question}
          onInput={(e) => {
            setQuestion(paneId, e.currentTarget.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitQuestion();
            }
          }}
          placeholder="Ask a question... (Enter to submit, Shift+Enter for newline)"
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

      {/* Generated query (editable) */}
      <Show when={state().generatedQuery}>
        <div class="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <CodeInput
            value={state().generatedQuery}
            onChange={(v) => setGeneratedQuery(paneId, v)}
            onSubmit={runQuery}
            class="flex-1 min-h-[32px]"
          />
          <button
            type="button"
            disabled={state().loading}
            onClick={runQuery}
            class="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded transition-colors self-start"
          >
            Run
          </button>
        </div>
      </Show>

      {/* Results */}
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

        <Show
          when={
            !state().table &&
            !state().error &&
            !state().loading &&
            !state().generatedQuery
          }
        >
          <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Ask a question in natural language
          </div>
        </Show>
      </div>
    </div>
  );
}
