import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import Resizable from '@corvu/resizable';
import type { SplitPane as SplitPaneType, PaneNode } from '../types';
import { LayoutNode } from './LayoutRoot';

interface Props {
  pane: SplitPaneType;
}

// Wrapper to ensure panels remount when tree structure changes
const PanelWithChild: Component<{
  child: PaneNode;
  size: number;
  isLast: boolean;
  orientation: 'horizontal' | 'vertical';
}> = (props) => {
  return (
    <>
      <Resizable.Panel
        initialSize={props.size / 100}
        minSize={0.05}
        class="overflow-hidden"
      >
        <div class="h-full w-full">
          <LayoutNode pane={props.child} />
        </div>
      </Resizable.Panel>
      <Show when={!props.isLast}>
        <Resizable.Handle class="shrink-0 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors data-[orientation=horizontal]:w-1 data-[orientation=horizontal]:cursor-col-resize data-[orientation=vertical]:h-1 data-[orientation=vertical]:cursor-row-resize" />
      </Show>
    </>
  );
};

export const SplitPane: Component<Props> = (props) => {
  const orientation = () => (props.pane.dir === 'h' ? 'horizontal' : 'vertical');
  const flexClass = () => (props.pane.dir === 'h' ? 'flex-row' : 'flex-col');

  // Create a key from children IDs to force remount when structure changes
  const structureKey = () => props.pane.children.map(c => c.id).join('-');

  return (
    <Show when={structureKey()} keyed>
      {(_key) => (
        <Resizable orientation={orientation()} class={`h-full w-full flex ${flexClass()}`}>
          <For each={props.pane.children}>
            {(child, index) => (
              <PanelWithChild
                child={child}
                size={props.pane.sizes[index()]}
                isLast={index() === props.pane.children.length - 1}
                orientation={orientation()}
              />
            )}
          </For>
        </Resizable>
      )}
    </Show>
  );
};
