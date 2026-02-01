import { createDraggable } from "@thisbeyond/solid-dnd";
import type { Component, JSX } from "solid-js";

interface Props {
  id: string;
  specId: string;
  children: JSX.Element;
  class?: string;
}

export const DraggableItem: Component<Props> = (props) => {
  const draggable = createDraggable(props.id, { specId: props.specId });

  return (
    <div
      ref={draggable.ref}
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
