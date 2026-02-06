import { createDraggable } from "@thisbeyond/solid-dnd";
import type { Component, JSX } from "solid-js";

interface Props {
  id: string;
  specId: string;
  children: JSX.Element;
  class?: string;
  testId?: string;
  /** Optional data to pass to the new tile when created */
  initialData?: unknown;
}

export const DraggableItem: Component<Props> = (props) => {
  const draggable = createDraggable(props.id, {
    specId: props.specId,
    initialData: props.initialData,
  });

  return (
    <div
      ref={draggable.ref}
      data-testid={props.testId}
      class={`cursor-grab active:cursor-grabbing ${props.class ?? ""}`}
      classList={{
        "opacity-50": draggable.isActiveDraggable,
      }}
      {...draggable.dragActivators}
    >
      {props.children}
    </div>
  );
};
