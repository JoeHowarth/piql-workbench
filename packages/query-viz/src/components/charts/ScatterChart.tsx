import type { Component } from "solid-js";
import { createMemo } from "solid-js";
import type { ScatterChartProps } from "../../lib/chartTypes";
import { useScatterChartOptions } from "../../hooks/useChartSeries";
import { BaseChart } from "./BaseChart";

export const ScatterChart: Component<ScatterChartProps> = (props) => {
  const configAccessor = createMemo(() => props.config);
  const option = useScatterChartOptions(props.table, configAccessor);
  const loading = createMemo(() => props.table() === null);

  return <BaseChart option={option} loading={loading} class={props.class} />;
};
