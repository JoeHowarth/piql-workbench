import Resizable, { useContext as useResizableContext } from "@corvu/resizable";
import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import { useWorkbench } from "../context";
import type { SplitPane as SplitPaneType } from "../types";
import { LayoutNode } from "./LayoutRoot";

interface Props {
  pane: SplitPaneType;
}

// Handle component that syncs sizes on drag end
const SyncHandle: Component<{
  paneId: string;
  class: string;
  ariaLabel: string;
}> = (props) => {
  const { updateSizes } = useWorkbench();
  const resizable = useResizableContext();

  const handleDragEnd = () => {
    const sizes = resizable.sizes();
    const percentages = sizes.map((s: number) => s * 100);
    updateSizes(props.paneId, percentages);
  };

  return (
    <Resizable.Handle
      onHandleDragEnd={handleDragEnd}
      class={props.class}
      aria-label={props.ariaLabel}
    />
  );
};

export const SplitPane: Component<Props> = (props) => {
  const { getSizes } = useWorkbench();

  const orientation = () =>
    props.pane.dir === "h" ? "horizontal" : "vertical";
  const flexClass = () => (props.pane.dir === "h" ? "flex-row" : "flex-col");

  // Key for structure changes - forces remount when children change
  const structureKey = () => props.pane.children.map((c) => c.id).join("-");

  // Check if any sizes are pixel-based
  const hasPixelSizes = () =>
    props.pane.sizes.some((s) => typeof s === "object" && "px" in s);

  // Get sizes for rendering
  const sizes = () => getSizes(props.pane.id, props.pane.sizes);

  // For pixel-based layouts, use CSS flex directly instead of corvu/resizable.
  // This means pixel-based splits are NOT user-resizable (no drag handles).
  //
  // Background: corvu/resizable had a bug where nested splits with pixel sizes
  // would cause parent splits to recalculate incorrectly when children remounted.
  // For example, inserting a tile vertically into the left sidebar would shrink
  // the main content pane by ~180px (the sidebar's pixel width). The tree logic
  // was correct (unit tests pass), but corvu's internal size tracking was off.
  //
  // If user-resizable pixel-based splits are needed in the future, options:
  // 1. Implement custom resize handles with CSS flex
  // 2. Debug corvu/resizable's size sync on nested remounts
  // 3. Use a different resizable library
  if (hasPixelSizes()) {
    return (
      <div class={`h-full w-full flex ${flexClass()}`}>
        <For each={props.pane.children}>
          {(child, index) => {
            const size = () => sizes()[index()];
            const style = () => {
              const s = size();
              if (typeof s === "object" && "px" in s) {
                // Fixed pixel size
                return props.pane.dir === "h"
                  ? { width: `${s.px}px`, "flex-shrink": 0 }
                  : { height: `${s.px}px`, "flex-shrink": 0 };
              }
              // Flex grow for percentage-based
              return { flex: 1 };
            };
            return (
              <>
                <div class="overflow-hidden" style={style()}>
                  <div class="h-full w-full">
                    <LayoutNode pane={child} />
                  </div>
                </div>
                <Show when={index() < props.pane.children.length - 1}>
                  <div
                    class={`shrink-0 bg-gray-300 dark:bg-gray-600 ${
                      props.pane.dir === "h" ? "w-0.5" : "h-0.5"
                    }`}
                  />
                </Show>
              </>
            );
          }}
        </For>
      </div>
    );
  }

  // For percentage-based layouts, use corvu/resizable
  return (
    <Show when={structureKey()} keyed>
      {(_key) => (
        <Resizable
          orientation={orientation()}
          class={`h-full w-full flex ${flexClass()}`}
        >
          <For each={props.pane.children}>
            {(child, index) => (
              <>
                <Resizable.Panel
                  initialSize={(sizes()[index()] as number) / 100}
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
                    ariaLabel="Resize panes"
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
