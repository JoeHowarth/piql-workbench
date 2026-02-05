// Table Components
export { ColumnFilter } from "./components/ColumnFilter";
export { DataFrameTable } from "./components/DataFrameTable";
export { ResizeHandle } from "./components/ResizeHandle";
export { TableBody } from "./components/TableBody";
export { TableCell } from "./components/TableCell";
export { TableHeader } from "./components/TableHeader";

// Chart Components
export { BaseChart, LineChart, BarChart, ScatterChart } from "./components/charts";

// Table Hooks
export { useArrowData } from "./hooks/useArrowData";
export { useDerivedRows } from "./hooks/useDerivedRows";
export { useTableState } from "./hooks/useTableState";

// Chart Hooks
export {
  useLineChartOptions,
  useBarChartOptions,
  useScatterChartOptions,
} from "./hooks/useChartSeries";

// Arrow Utilities
export {
  isBooleanType,
  isNumericType,
  isTemporalType,
  parseArrowBuffer,
  parseArrowTable,
} from "./lib/arrow";

// Chart Utilities
export { CHART_PALETTE, getSeriesColor } from "./lib/chartPalette";

// Table Types
export type {
  ColumnConfig,
  ColumnSchema,
  FilterValue,
  ParsedArrowData,
  SortDir,
  SortState,
  TableConfig,
  TableState,
} from "./lib/types";

// Chart Types
export type {
  AxisConfig,
  AxisType,
  BarChartConfig,
  BarChartProps,
  BarMode,
  BarOrientation,
  ChartConfig,
  LegendConfig,
  LineChartConfig,
  LineChartProps,
  ScatterChartConfig,
  ScatterChartProps,
  ScatterDimensionMapping,
  SeriesMapping,
  TooltipConfig,
} from "./lib/chartTypes";
