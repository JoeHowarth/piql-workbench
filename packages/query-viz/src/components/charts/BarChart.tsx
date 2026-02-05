import type { Component } from "solid-js";
import { createMemo } from "solid-js";
import type { BarChartProps } from "../../lib/chartTypes";
import { useBarChartOptions } from "../../hooks/useChartSeries";
import { BaseChart } from "./BaseChart";

export const BarChart: Component<BarChartProps> = (props) => {
  const configAccessor = createMemo(() => {
    console.log("[BarChart] config:", props.config);
    return props.config;
  });
  const option = useBarChartOptions(props.table, configAccessor);

  // Debug log
  createMemo(() => {
    console.log("[BarChart] option:", option());
  });

  const loading = createMemo(() => props.table() === null);

  return <BaseChart option={option} loading={loading} class={props.class} />;
};
