import { Show, Switch, Match } from 'solid-js';
import type { Component } from 'solid-js';
import type { PaneNode } from '../types';
import { useWorkbench } from '../context';
import { LeafPane } from './LeafPane';
import { SplitPane } from './SplitPane';

// Recursive component to render a pane node
export const LayoutNode: Component<{ pane: PaneNode }> = (props) => {
  return (
    <Switch>
      <Match when={props.pane.type === 'leaf'}>
        <LeafPane pane={props.pane as any} />
      </Match>
      <Match when={props.pane.type === 'split'}>
        <SplitPane pane={props.pane as any} />
      </Match>
    </Switch>
  );
};

// Root component that starts the tree
export const LayoutRoot: Component = () => {
  const { layout } = useWorkbench();

  return (
    <div class="h-full w-full">
      <Show
        when={layout()}
        fallback={
          <div class="h-full flex items-center justify-center text-gray-400">
            No tiles open
          </div>
        }
      >
        {(node) => <LayoutNode pane={node()} />}
      </Show>
    </div>
  );
};
