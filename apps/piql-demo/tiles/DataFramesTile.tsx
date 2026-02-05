import { createResource, For, Show } from "solid-js";
import type { TileSpec } from "workbench";
import { DraggableItem } from "workbench";
import { client } from "../piql";

export const dataframesTile = (): TileSpec => ({
  id: "dataframes",
  title: "DataFrames",
  closable: false,
  component: DataFramesContent,
});

function DataFramesContent() {
  const [dataframes] = createResource(() => client.listDataframes());

  return (
    <div class="p-2 space-y-1 overflow-y-auto h-full">
      <Show when={dataframes.loading}>
        <div class="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </Show>

      <Show when={dataframes.error}>
        <div class="text-sm text-red-500 dark:text-red-400">
          Failed to load dataframes
        </div>
      </Show>

      <For each={dataframes()}>
        {(name) => (
          <DraggableItem
            id={`df-${name}`}
            specId="query"
            initialData={{ query: `${name}.describe()`, execute: true }}
            class="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 cursor-grab"
          >
            {name}
          </DraggableItem>
        )}
      </For>
    </div>
  );
}
