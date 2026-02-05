import {
  createDraggable,
  createDroppable,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import { PaneIdContext, useWorkbench } from "../context";
import { getDropPosition, getDropZoneStyle } from "../dnd/dropZones";
import type { LeafPane as LeafPaneType } from "../types";

interface Props {
  pane: LeafPaneType;
}

export const LeafPane: Component<Props> = (props) => {
  const { getSpec, removePane } = useWorkbench();
  const [dropPosition, setDropPosition] = createSignal<string | null>(null);
  const [isHovered, setIsHovered] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const spec = () => getSpec(props.pane.specId);
  const closable = () => spec()?.closable !== false;

  // Use different ID prefixes for draggable vs droppable to avoid collision
  const droppable = createDroppable(`drop-${props.pane.id}`, {
    paneId: props.pane.id,
    get closable() {
      return closable();
    },
    get dropPosition() {
      return dropPosition();
    },
  });

  // Make the pane draggable by its title bar
  const draggable = createDraggable(`drag-${props.pane.id}`, {
    paneId: props.pane.id,
  });

  // Get drag context to detect when dragging is active
  const ctx = useDragDropContext();
  const isDragging = () => ctx?.[0]?.active?.draggable != null;
  const isBeingDragged = () =>
    ctx?.[0]?.active?.draggable?.id === `drag-${props.pane.id}`;

  // Track mouse position to determine drop zone
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging() || !containerRef) {
      setDropPosition(null);
      return;
    }

    const rect = containerRef.getBoundingClientRect();
    const pos = getDropPosition(e.clientX, e.clientY, rect);

    // Non-closable tiles can't be replaced via center drop
    if (pos === "center" && !closable()) {
      setDropPosition(null);
      return;
    }

    setDropPosition(pos);
  };

  const handleMouseLeave = () => {
    setDropPosition(null);
  };

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation();
    removePane(props.pane.id);
  };

  const containerClass = () => {
    const base =
      "relative flex flex-col h-full bg-white dark:bg-gray-800 rounded overflow-hidden transition-all duration-150 border";
    if (isBeingDragged()) {
      // pointer-events-none so collision detection sees through to tiles underneath
      return `${base} border-blue-400 dark:border-blue-500 opacity-50 pointer-events-none`;
    }
    if (isHovered()) {
      return `${base} border-blue-400 dark:border-blue-500 shadow-md dark:shadow-gray-900/50`;
    }
    return `${base} border-gray-200 dark:border-gray-700`;
  };

  return (
    <div
      ref={(el) => {
        containerRef = el;
        droppable.ref(el);
      }}
      class={containerClass()}
      data-testid={`pane-${props.pane.specId}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={(_e) => {
        handleMouseLeave();
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
    >
      {/* Title bar - draggable */}
      <div
        ref={draggable.ref}
        class="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 cursor-grab active:cursor-grabbing select-none"
        {...draggable.dragActivators}
      >
        <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
          {spec()?.title ?? "Unknown"}
        </span>
        <Show when={closable()}>
          <button
            type="button"
            class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
            title="Close"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </Show>
      </div>

      {/* Content - pointer-events-none during drag so mouse events reach container */}
      <div class="flex-1 overflow-auto">
        <div class="h-full" classList={{ "pointer-events-none": isDragging() }}>
          <Show
            when={spec()}
            fallback={
              <div class="p-2 text-gray-400 dark:text-gray-500 text-sm">
                Tile not found
              </div>
            }
          >
            <PaneIdContext.Provider value={() => props.pane.id}>
              {spec()!.component()}
            </PaneIdContext.Provider>
          </Show>
        </div>
      </div>

      {/* Drop zone overlay */}
      <Show when={isDragging() && dropPosition()}>
        <div
          class="absolute pointer-events-none bg-blue-500/30 border-2 border-blue-500 rounded transition-all duration-100"
          style={getDropZoneStyle(dropPosition() as any)}
        />
      </Show>
    </div>
  );
};
