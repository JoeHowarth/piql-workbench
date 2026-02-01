import { createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import type { TileSpec } from 'workbench';

export const timeControlsTile = (): TileSpec => ({
  id: 'time-controls',
  title: 'Time Controls',
  closable: false,
  component: () => <TimeControlsContent />,
});

const FastIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
);

const SlowIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
  </svg>
);

const TimeControlsContent: Component = () => {
  const [tick, setTick] = createSignal(0);
  const [playing, setPlaying] = createSignal(false);
  const [speed, setSpeed] = createSignal(1); // ticks per second

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

  const halveSpeed = () => {
    const newSpeed = Math.max(0.06, speed() / 2);
    setSpeed(newSpeed);
    if (playing()) {
      stopPlaying();
      startPlaying();
    }
  };

  const doubleSpeed = () => {
    const newSpeed = Math.min(16, speed() * 2);
    setSpeed(newSpeed);
    if (playing()) {
      stopPlaying();
      startPlaying();
    }
  };

  // Format speed for display
  const speedDisplay = () => {
    const s = speed();
    if (s >= 1) return s.toString();
    return s.toFixed(2).replace(/\.?0+$/, '');
  };

  onCleanup(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return (
    <div class="h-full flex items-center justify-center p-2">
      <div class="flex items-center gap-2">
        {/* Tick counter */}
        <div class="flex flex-col items-center min-w-[40px]">
          <span class="text-lg font-mono font-semibold text-gray-800 dark:text-gray-100 tabular-nums leading-none">
            {tick()}
          </span>
          <span class="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            tick
          </span>
        </div>

        {/* Divider */}
        <div class="w-px h-7 bg-gray-200 dark:bg-gray-700" />

        {/* Speed controls: << [play/speed] >> */}
        <div class="flex items-center gap-1">
          {/* Slower */}
          <button
            class="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            onClick={halveSpeed}
            title="Half speed"
          >
            <SlowIcon class="w-4 h-4" />
          </button>

          {/* Play/Pause with speed display */}
          <button
            class="w-8 h-7 flex items-center justify-center rounded transition-all"
            classList={{
              'bg-green-500 hover:bg-green-600 text-white': playing(),
              'bg-gray-300 dark:bg-gray-500 hover:bg-gray-400 dark:hover:bg-gray-400 text-gray-600 dark:text-gray-200': !playing(),
            }}
            onClick={togglePlay}
            title={playing() ? 'Pause' : 'Play'}
          >
            <span class="text-[10px] font-bold font-mono tabular-nums">
              {speedDisplay()}
            </span>
          </button>

          {/* Faster */}
          <button
            class="w-7 h-7 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            onClick={doubleSpeed}
            title="Double speed"
          >
            <FastIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
