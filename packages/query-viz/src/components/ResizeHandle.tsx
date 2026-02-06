import type { Component } from "solid-js";

interface Props {
  onResize: (delta: number) => void;
  testId?: string;
  ariaLabel?: string;
  keyboardStep?: number;
}

export const ResizeHandle: Component<Props> = (props) => {
  let startX = 0;
  const keyboardStep = () => props.keyboardStep ?? 12;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      startX = moveEvent.clientX;
      props.onResize(delta);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <button
      type="button"
      data-testid={props.testId}
      aria-label={props.ariaLabel ?? "Resize column"}
      class="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          props.onResize(-keyboardStep());
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          props.onResize(keyboardStep());
        }
      }}
    />
  );
};
