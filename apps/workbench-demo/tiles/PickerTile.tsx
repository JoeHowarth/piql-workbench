import { For } from 'solid-js';
import type { Component } from 'solid-js';
import { useWorkbench, DraggableItem } from 'workbench';
import type { TileSpec } from 'workbench';

export const pickerTile = (): TileSpec => ({
  id: 'picker',
  title: 'Tiles',
  closable: false,
  component: () => <PickerContent />,
});

const PickerContent: Component = () => {
  const { specs } = useWorkbench();

  // Filter out the picker itself and non-closable tiles
  const availableSpecs = () =>
    specs().filter((s) => s.id !== 'picker' && s.closable !== false);

  return (
    <div class="p-2 space-y-1">
      <For each={availableSpecs()}>
        {(spec) => (
          <DraggableItem
            id={`picker-${spec.id}`}
            specId={spec.id}
            class="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 cursor-grab"
          >
            {spec.title}
          </DraggableItem>
        )}
      </For>
    </div>
  );
};
