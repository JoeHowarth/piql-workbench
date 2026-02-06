import type {
  BarChartProps,
  LineChartProps,
  ScatterChartProps,
} from "query-viz";
import { type Component, lazy } from "solid-js";

const loadBarChart = () =>
  import("query-viz").then((mod) => ({ default: mod.BarChart }));
const loadLineChart = () =>
  import("query-viz").then((mod) => ({ default: mod.LineChart }));
const loadScatterChart = () =>
  import("query-viz").then((mod) => ({ default: mod.ScatterChart }));

export const LazyBarChart = lazy(loadBarChart) as Component<BarChartProps>;
export const LazyLineChart = lazy(loadLineChart) as Component<LineChartProps>;
export const LazyScatterChart = lazy(
  loadScatterChart,
) as Component<ScatterChartProps>;
