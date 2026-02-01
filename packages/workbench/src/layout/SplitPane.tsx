import { For, Show, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import Resizable, { useContext as useResizableContext } from '@corvu/resizable';
import type { SplitPane as SplitPaneType, SizeSpec } from '../types';
import { LayoutNode } from './LayoutRoot';
import { useWorkbench } from '../context';

interface Props {
  pane: SplitPaneType;
}

// Handle component that syncs sizes on drag end
const SyncHandle: Component<{ paneId: string; class: string }> = (props) => {
  const { updateSizes } = useWorkbench();
  const resizable = useResizableContext();

  const handleDragEnd = () => {
    const sizes = resizable.sizes();
    const percentages = sizes.map((s: number) => s * 100);
    updateSizes(props.paneId, percentages);
  };

  return (
    <Resizable.Handle onHandleDragEnd={handleDragEnd} class={props.class} />
  );
};

// Convert SizeSpec array to percentages based on container dimension
function convertSizesToPercentages(specs: SizeSpec[], containerSize: number): number[] {
  // First pass: calculate total pixels and count of percentage-based sizes
  let totalPixels = 0;
  let percentageCount = 0;
  let percentageSum = 0;

  for (const spec of specs) {
    if (typeof spec === 'object' && 'px' in spec) {
      totalPixels += spec.px;
    } else {
      percentageCount++;
      percentageSum += spec;
    }
  }

  // Convert pixels to percentages
  const remainingPercent = 100 - (totalPixels / containerSize) * 100;
  const scale = percentageCount > 0 ? remainingPercent / percentageSum : 1;

  return specs.map((spec) => {
    if (typeof spec === 'object' && 'px' in spec) {
      return (spec.px / containerSize) * 100;
    }
    return spec * scale;
  });
}

export const SplitPane: Component<Props> = (props) => {
  const { getSizes } = useWorkbench();
  let containerRef: HTMLDivElement | undefined;
  const [containerSize, setContainerSize] = createSignal<number | null>(null);

  const orientation = () => (props.pane.dir === 'h' ? 'horizontal' : 'vertical');
  const flexClass = () => (props.pane.dir === 'h' ? 'flex-row' : 'flex-col');

  // Key for structure changes - forces remount when children change
  const structureKey = () => props.pane.children.map(c => c.id).join('-');

  // Check if any sizes are pixel-based
  const hasPixelSizes = () => props.pane.sizes.some(s => typeof s === 'object' && 'px' in s);

  // Get sizes, converting pixels to percentages if needed
  const sizes = () => {
    const rawSizes = getSizes(props.pane.id, props.pane.sizes);

    // If we have pixel sizes and container is measured, convert
    if (hasPixelSizes() && containerSize()) {
      return convertSizesToPercentages(rawSizes as SizeSpec[], containerSize()!);
    }

    // Otherwise assume all percentages
    return rawSizes as number[];
  };

  onMount(() => {
    if (containerRef && hasPixelSizes()) {
      const dim = props.pane.dir === 'h' ? containerRef.offsetWidth : containerRef.offsetHeight;
      setContainerSize(dim);
    }
  });

  return (
    <div ref={containerRef} class="h-full w-full">
      <Show when={!hasPixelSizes() || containerSize()} fallback={<div class="h-full w-full" />}>
        <Show when={structureKey()} keyed>
          {(_key) => (
            <Resizable orientation={orientation()} class={`h-full w-full flex ${flexClass()}`}>
              <For each={props.pane.children}>
                {(child, index) => (
                  <>
                    <Resizable.Panel
                      initialSize={sizes()[index()] / 100}
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
                        class="shrink-0 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors data-[orientation=horizontal]:w-0.5 data-[orientation=horizontal]:cursor-col-resize data-[orientation=vertical]:h-0.5 data-[orientation=vertical]:cursor-row-resize"
                      />
                    </Show>
                  </>
                )}
              </For>
            </Resizable>
          )}
        </Show>
      </Show>
    </div>
  );
};
