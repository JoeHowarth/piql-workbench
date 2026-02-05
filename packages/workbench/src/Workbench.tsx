import type { Component } from "solid-js";
import { createWorkbenchContext } from "./context";
import { DndProvider } from "./dnd/DndProvider";
import { LayoutRoot } from "./layout/LayoutRoot";
import type { WorkbenchProps } from "./types";

export const Workbench: Component<WorkbenchProps> = (props) => {
  const { Provider, value } = createWorkbenchContext(
    props.specs,
    props.initialLayout,
    props.onTileAdded,
  );

  return (
    <Provider value={value}>
      <DndProvider>
        <div class={`h-full w-full ${props.class ?? ""}`}>
          <LayoutRoot />
        </div>
      </DndProvider>
    </Provider>
  );
};
