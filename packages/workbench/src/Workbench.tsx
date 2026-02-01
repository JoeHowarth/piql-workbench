import type { Component } from 'solid-js';
import type { WorkbenchProps } from './types';
import { createWorkbenchContext } from './context';
import { LayoutRoot } from './layout/LayoutRoot';
import { DndProvider } from './dnd/DndProvider';

export const Workbench: Component<WorkbenchProps> = (props) => {
  const { Provider, value } = createWorkbenchContext(props.specs, props.initialLayout);

  return (
    <Provider value={value}>
      <DndProvider>
        <div class={`h-full w-full ${props.class ?? ''}`}>
          <LayoutRoot />
        </div>
      </DndProvider>
    </Provider>
  );
};
