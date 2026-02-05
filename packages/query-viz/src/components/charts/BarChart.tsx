import type { Component } from "solid-js";
import { createMemo } from "solid-js";
import type { BarChartProps } from "../../lib/chartTypes";
import { useBarChartOptions } from "../../hooks/useChartSeries";
import { BaseChart } from "./BaseChart";

export const BarChart: Component<BarChartProps> = (props) => {
  const configAccessor = createMemo(() => props.config);
  const option = useBarChartOptions(props.table, configAccessor);
  const loading = createMemo(() => props.table() === null);

  return <BaseChart option={option} loading={loading} class={props.class} />;
};
