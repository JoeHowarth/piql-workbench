import {
  DragDropProvider,
  DragDropSensors,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import type { Component, JSX } from "solid-js";
import { useWorkbench } from "../context";
import type { DropPosition } from "../types";

// Custom collision detector that finds the droppable the cursor is actually over
// We use the dropPosition data that LeafPane sets via mouse tracking
const collisionDetector = (
  draggable: any,
  droppables: any[],
  _context: any,
) => {
  // Exclude the droppable corresponding to the dragged tile
  const sourcePaneId = draggable.data?.paneId;
  const candidates = sourcePaneId
    ? droppables.filter((d) => d.data?.paneId !== sourcePaneId)
    : droppables;

  // Find the droppable that has a dropPosition set (meaning cursor is over it)
  const activeDroppable = candidates.find((d) => d.data?.dropPosition != null);
  if (activeDroppable) {
    return activeDroppable;
  }

  // Fallback to checking which droppable contains the draggable center
  const draggableRect = draggable.transformed;
  if (draggableRect) {
    const centerX = draggableRect.left + draggableRect.width / 2;
    const centerY = draggableRect.top + draggableRect.height / 2;

    for (const droppable of candidates) {
      const rect = droppable.node.getBoundingClientRect();
      if (
        centerX >= rect.left &&
        centerX <= rect.right &&
        centerY >= rect.top &&
        centerY <= rect.bottom
      ) {
        return droppable;
      }
    }
  }

  return null;
};

interface Props {
  children: JSX.Element;
}

// Internal component that uses the drag-drop context
const DndHandler: Component<Props> = (props) => {
  const { addTile, movePane } = useWorkbench();
  const [, { onDragEnd }] = useDragDropContext()!;

  onDragEnd(({ draggable, droppable }) => {
    if (!droppable) return;

    const specId = draggable.data?.specId as string | undefined;
    const sourcePaneId = draggable.data?.paneId as string | undefined;
    const targetPaneId = droppable.data?.paneId as string | undefined;
    const targetClosable = droppable.data?.closable as boolean | undefined;
    const position = droppable.data?.dropPosition as DropPosition | undefined;

    if (!position || !targetPaneId) return;

    // Don't allow center drops on non-closable tiles (would replace them)
    if (position === "center" && targetClosable === false) return;

    if (specId) {
      // Dragging from picker - add new tile
      addTile(specId, targetPaneId, position);
    } else if (sourcePaneId && sourcePaneId !== targetPaneId) {
      // Dragging existing pane - move it
      movePane(sourcePaneId, targetPaneId, position);
    }
  });

  return <div class="h-full w-full">{props.children}</div>;
};

export const DndProvider: Component<Props> = (props) => {
  return (
    <DragDropProvider collisionDetector={collisionDetector}>
      <DragDropSensors>
        <div class="h-full w-full">
          <DndHandler>{props.children}</DndHandler>
        </div>
      </DragDropSensors>
    </DragDropProvider>
  );
};
