import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import Resizable, { useContext as useResizableContext } from '@corvu/resizable';
import type { SplitPane as SplitPaneType, PaneNode } from '../types';
import { LayoutNode } from './LayoutRoot';
import { useWorkbench } from '../context';

interface Props {
  pane: SplitPaneType;
}

// Handle component that syncs sizes on drag end
const SyncHandle: Component<{ paneId: string; class: string }> = (props) => {
  const { updateSizes } = useWorkbench();
  const resizable = useResizableContext();

  const handleDragEnd = () => {
    const sizes = resizable.sizes();
    const percentages = sizes.map((s: number) => s * 100);
    updateSizes(props.paneId, percentages);
  };

  return (
    <Resizable.Handle onHandleDragEnd={handleDragEnd} class={props.class} />
  );
};

export const SplitPane: Component<Props> = (props) => {
  const { getSizes } = useWorkbench();
  const orientation = () => (props.pane.dir === 'h' ? 'horizontal' : 'vertical');
  const flexClass = () => (props.pane.dir === 'h' ? 'flex-row' : 'flex-col');

  // Key for structure changes - forces remount when children change
  const structureKey = () => props.pane.children.map(c => c.id).join('-');

  // Get sizes from override map or fall back to tree
  const sizes = () => getSizes(props.pane.id, props.pane.sizes);

  return (
    <Show when={structureKey()} keyed>
      {(_key) => (
        <Resizable orientation={orientation()} class={`h-full w-full flex ${flexClass()}`}>
          <For each={props.pane.children}>
            {(child, index) => (
              <>
                <Resizable.Panel
                  initialSize={sizes()[index()] / 100}
                  minSize={0.05}
                  class="overflow-hidden"
                >
                  <div class="h-full w-full">
                    <LayoutNode pane={child} />
                  </div>
                </Resizable.Panel>
                <Show when={index() < props.pane.children.length - 1}>
                  <SyncHandle
                    paneId={props.pane.id}
                    class="shrink-0 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors data-[orientation=horizontal]:w-0.5 data-[orientation=horizontal]:cursor-col-resize data-[orientation=vertical]:h-0.5 data-[orientation=vertical]:cursor-row-resize"
                  />
                </Show>
              </>
            )}
          </For>
        </Resizable>
      )}
    </Show>
  );
};
