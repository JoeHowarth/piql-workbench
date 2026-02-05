import type { EChartsOption } from "echarts";
import { EChartsAutoSize } from "echarts-solid";
import type { Accessor, Component } from "solid-js";
import { Show } from "solid-js";

interface BaseChartProps {
  option: Accessor<EChartsOption | null>;
  loading?: Accessor<boolean>;
  class?: string;
}

export const BaseChart: Component<BaseChartProps> = (props) => {
  return (
    <div class={`w-full h-full min-h-[200px] ${props.class ?? ""}`}>
      <Show
        when={props.option()}
        fallback={
          <div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No data
          </div>
        }
      >
        <EChartsAutoSize
          option={props.option()!}
          isLoading={props.loading?.() ?? false}
        />
      </Show>
    </div>
  );
};
