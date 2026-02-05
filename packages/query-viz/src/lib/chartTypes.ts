import type { Accessor } from "solid-js";
import type { Table } from "apache-arrow";

// ============ Axis Configuration ============

export type AxisType = "value" | "category" | "time" | "log";

export interface AxisConfig {
  column: string;
  label?: string;
  type?: AxisType; // Auto-inferred from Arrow type if omitted
  min?: number | "dataMin";
  max?: number | "dataMax";
}

// ============ Series Mapping ============

export interface SeriesMapping {
  column: string;
  label?: string;
  color?: string;
  yAxisIndex?: number; // For dual y-axis (0 or 1)
}

// ============ Common Config ============

export interface LegendConfig {
  show?: boolean; // Default true if multiple series
  position?: "top" | "bottom" | "left" | "right";
}

export interface TooltipConfig {
  show?: boolean; // Default true
  trigger?: "axis" | "item";
}

// ============ Line Chart ============

export interface LineChartConfig {
  xAxis: AxisConfig;
  series: SeriesMapping[];
  yAxis?: AxisConfig;
  yAxis2?: AxisConfig; // Secondary y-axis
  smooth?: boolean;
  area?: boolean;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

// ============ Bar Chart ============

export type BarOrientation = "vertical" | "horizontal";
export type BarMode = "grouped" | "stacked";

export interface BarChartConfig {
  categoryAxis: AxisConfig;
  series: SeriesMapping[];
  orientation?: BarOrientation; // Default "vertical"
  mode?: BarMode; // Default "grouped"
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

// ============ Scatter Chart ============

export interface ScatterDimensionMapping {
  x: string;
  y: string;
  size?: string;
  color?: string;
}

export interface ScatterChartConfig {
  dimensions: ScatterDimensionMapping;
  xAxis?: Partial<AxisConfig>;
  yAxis?: Partial<AxisConfig>;
  sizeRange?: [number, number]; // Default [5, 30]
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
}

// ============ Union Type ============

export type ChartConfig = LineChartConfig | BarChartConfig | ScatterChartConfig;

// ============ Component Props ============

export interface BaseChartProps {
  table: Accessor<Table | null>;
  class?: string;
}

export interface LineChartProps extends BaseChartProps {
  config: LineChartConfig;
}

export interface BarChartProps extends BaseChartProps {
  config: BarChartConfig;
}

export interface ScatterChartProps extends BaseChartProps {
  config: ScatterChartConfig;
}

// ============ Internal Types ============

export interface ChartSeriesData {
  categories: unknown[];
  seriesData: Array<{
    name: string;
    data: unknown[];
    yAxisIndex?: number;
  }>;
  scatterData?: Array<unknown[]>;
}
