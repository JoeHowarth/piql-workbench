import { createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { TileSpec } from 'workbench';

export const timeControlsTile = (): TileSpec => ({
  id: 'time-controls',
  title: 'Time Controls',
  closable: false,
  component: () => <TimeControlsContent />,
});

const TimeControlsContent: Component = () => {
  const [tick, setTick] = createSignal(0);
  const [playing, setPlaying] = createSignal(false);
  const [speed, setSpeed] = createSignal(1);

  let intervalId: number | undefined;

  const startPlaying = () => {
    if (intervalId) return;
    intervalId = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 1000 / speed());
    setPlaying(true);
  };

  const stopPlaying = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    setPlaying(false);
  };

  const togglePlay = () => {
    if (playing()) {
      stopPlaying();
    } else {
      startPlaying();
    }
  };

  const adjustSpeed = (delta: number) => {
    setSpeed((s) => Math.max(0.5, Math.min(10, s + delta)));
    if (playing()) {
      stopPlaying();
      startPlaying();
    }
  };

  onCleanup(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return (
    <div class="p-4 flex items-center gap-4">
      <div class="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200 min-w-[80px]">
        {tick()}
      </div>

      <button
        class="px-4 py-2 rounded font-medium transition-colors"
        classList={{
          'bg-green-600 text-white hover:bg-green-700': !playing(),
          'bg-red-600 text-white hover:bg-red-700': playing(),
        }}
        onClick={togglePlay}
      >
        {playing() ? 'Pause' : 'Play'}
      </button>

      <div class="flex items-center gap-2">
        <button
          class="px-2 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          onClick={() => adjustSpeed(-0.5)}
        >
          -
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
          {speed().toFixed(1)}x
        </span>
        <button
          class="px-2 py-1 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          onClick={() => adjustSpeed(0.5)}
        >
          +
        </button>
      </div>
    </div>
  );
};
