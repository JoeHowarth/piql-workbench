import { Component } from 'solid-js';

interface Props {
  onResize: (delta: number) => void;
}

export const ResizeHandle: Component<Props> = (props) => {
  let startX = 0;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    startX = e.clientX;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      startX = moveEvent.clientX;
      props.onResize(delta);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      class="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
      onMouseDown={onMouseDown}
    />
  );
};
