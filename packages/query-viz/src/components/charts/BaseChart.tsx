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
    <div
      class={props.class ?? ""}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Show
        when={props.option()}
        fallback={
          <div style={{ width: "100%", height: "100%", display: "flex", "align-items": "center", "justify-content": "center", color: "#9ca3af", "font-size": "14px" }}>
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
