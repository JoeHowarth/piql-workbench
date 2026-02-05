import type { Component } from "solid-js";
import { createMemo } from "solid-js";
import type { LineChartProps } from "../../lib/chartTypes";
import { useLineChartOptions } from "../../hooks/useChartSeries";
import { BaseChart } from "./BaseChart";

export const LineChart: Component<LineChartProps> = (props) => {
  const configAccessor = createMemo(() => props.config);
  const option = useLineChartOptions(props.table, configAccessor);
  const loading = createMemo(() => props.table() === null);

  return <BaseChart option={option} loading={loading} class={props.class} />;
};
