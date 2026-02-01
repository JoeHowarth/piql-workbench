import { DragDropProvider, DragDropSensors, useDragDropContext, DragOverlay } from '@thisbeyond/solid-dnd';
import { createSignal, createEffect, Show } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import { useWorkbench } from '../context';
import type { DropPosition } from '../types';

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
    if (position === 'center' && targetClosable === false) return;

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
    <DragDropProvider>
      <DragDropSensors>
        <div class="h-full w-full">
          <DndHandler>{props.children}</DndHandler>
        </div>
      </DragDropSensors>
    </DragDropProvider>
  );
};
