import type { EChartsOption } from "echarts";
import type { Table } from "apache-arrow";
import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import { useArrowData } from "./useArrowData";
import { isTemporalType, isNumericType } from "../lib/arrow";
import type { ColumnSchema } from "../lib/types";
import type {
  LineChartConfig,
  BarChartConfig,
  ScatterChartConfig,
  AxisType,
} from "../lib/chartTypes";
import {
  CHART_PALETTE,
  CHART_GRID,
  CHART_TEXT_STYLE,
  CHART_AXIS_STYLE,
  getSeriesColor,
} from "../lib/chartPalette";

// Infer axis type from Arrow column type
function inferAxisType(schema: ColumnSchema[], column: string): AxisType {
  const col = schema.find((c) => c.name === column);
  if (!col) return "category";
  if (isTemporalType(col.type)) return "time";
  if (isNumericType(col.type)) return "value";
  return "category";
}

// Convert bigint timestamps to JS Date (for time series)
function toChartValue(value: unknown): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return new Date(Number(value));
  if (typeof value === "number") return value;
  return String(value);
}

// Convert to number only - no date interpretation (for scatter/numeric axes)
function toNumericValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// ============ Line Chart ============

export function useLineChartOptions(
  table: Accessor<Table | null>,
  config: Accessor<LineChartConfig>,
): Accessor<EChartsOption | null> {
  const data = useArrowData(table);

  return createMemo((): EChartsOption | null => {
    const { schema, rows } = data;
    const cfg = config();
    if (rows.length === 0) return null;

    const xCol = cfg.xAxis.column;
    const xType = cfg.xAxis.type ?? inferAxisType(schema, xCol);
    const categories = rows.map((r) => toChartValue(r[xCol]));

    const series = cfg.series.map((s, i) => ({
      type: "line" as const,
      name: s.label ?? s.column,
      data:
        xType === "time"
          ? rows.map((r) => [toChartValue(r[xCol]), toChartValue(r[s.column])])
          : rows.map((r) => toChartValue(r[s.column])),
      yAxisIndex: s.yAxisIndex ?? 0,
      smooth: cfg.smooth,
      areaStyle: cfg.area ? {} : undefined,
      itemStyle: { color: getSeriesColor(i, s.color) },
    }));

    const yAxes: EChartsOption["yAxis"] = [
      {
        type: "value" as const,
        name: cfg.yAxis?.label,
        min: cfg.yAxis?.min,
        max: cfg.yAxis?.max,
      },
    ];
    if (cfg.yAxis2) {
      (yAxes as object[]).push({
        type: "value" as const,
        name: cfg.yAxis2.label,
        min: cfg.yAxis2.min,
        max: cfg.yAxis2.max,
      });
    }

    return {
      color: CHART_PALETTE,
      textStyle: CHART_TEXT_STYLE,
      grid: CHART_GRID,
      tooltip: {
        show: cfg.tooltip?.show !== false,
        trigger: cfg.tooltip?.trigger ?? "axis",
      },
      legend: {
        show: cfg.legend?.show ?? series.length > 1,
        top: cfg.legend?.position === "bottom" ? undefined : 10,
        bottom: cfg.legend?.position === "bottom" ? 10 : undefined,
      },
      xAxis: {
        type: xType,
        data: xType === "category" ? (categories as string[]) : undefined,
        name: cfg.xAxis.label,
        // For value axes (e.g., block numbers), auto-scale to data range
        min: cfg.xAxis.min ?? (xType === "value" ? "dataMin" : undefined),
        max: cfg.xAxis.max ?? (xType === "value" ? "dataMax" : undefined),
        ...CHART_AXIS_STYLE,
      },
      yAxis: (yAxes as object[]).map((y) => ({ ...y, ...CHART_AXIS_STYLE })),
      series: series as EChartsOption["series"],
    };
  });
}

// ============ Bar Chart ============

export function useBarChartOptions(
  table: Accessor<Table | null>,
  config: Accessor<BarChartConfig>,
): Accessor<EChartsOption | null> {
  const data = useArrowData(table);

  return createMemo((): EChartsOption | null => {
    const { rows, schema } = data;
    const cfg = config();
    console.log("[useBarChartOptions] rows.length:", rows.length, "schema:", schema, "config:", cfg);
    if (rows.length === 0) {
      console.log("[useBarChartOptions] No rows, returning null");
      return null;
    }

    const catCol = cfg.categoryAxis.column;
    const categories = rows.map((r) => String(r[catCol] ?? ""));
    const isHorizontal = cfg.orientation === "horizontal";

    const series = cfg.series.map((s, i) => ({
      type: "bar" as const,
      name: s.label ?? s.column,
      data: rows.map((r) => toChartValue(r[s.column])),
      stack: cfg.mode === "stacked" ? "total" : undefined,
      itemStyle: { color: getSeriesColor(i, s.color) },
    }));

    const categoryAxisConfig = {
      type: "category" as const,
      data: categories,
      name: cfg.categoryAxis.label,
      ...CHART_AXIS_STYLE,
    };
    const valueAxisConfig = {
      type: "value" as const,
      ...CHART_AXIS_STYLE,
    };

    return {
      color: CHART_PALETTE,
      textStyle: CHART_TEXT_STYLE,
      grid: CHART_GRID,
      tooltip: {
        show: cfg.tooltip?.show !== false,
        trigger: cfg.tooltip?.trigger ?? "axis",
      },
      legend: {
        show: cfg.legend?.show ?? series.length > 1,
        top: cfg.legend?.position === "bottom" ? undefined : 10,
        bottom: cfg.legend?.position === "bottom" ? 10 : undefined,
      },
      xAxis: isHorizontal ? valueAxisConfig : categoryAxisConfig,
      yAxis: isHorizontal ? categoryAxisConfig : valueAxisConfig,
      series: series as EChartsOption["series"],
    };
  });
}

// ============ Scatter Chart ============

export function useScatterChartOptions(
  table: Accessor<Table | null>,
  config: Accessor<ScatterChartConfig>,
): Accessor<EChartsOption | null> {
  const data = useArrowData(table);

  return createMemo((): EChartsOption | null => {
    const { rows } = data;
    const cfg = config();
    if (rows.length === 0) return null;

    const { x, y, size } = cfg.dimensions;
    const [minSize, maxSize] = cfg.sizeRange ?? [8, 40];

    // Build scatter data points - use numeric values only (no date conversion)
    const scatterData = rows.map((r) => {
      const point: (number | null)[] = [toNumericValue(r[x]), toNumericValue(r[y])];
      if (size) point.push(toNumericValue(r[size]));
      return point;
    });

    // Calculate base symbol size - scales inversely with data count
    // Few points = larger dots, many points = smaller dots
    const baseSize = size ? undefined : Math.max(6, Math.min(12, 100 / Math.sqrt(rows.length)));

    // Calculate size normalization if size dimension is present
    let symbolSize: number | ((val: number[]) => number) = baseSize ?? 12;
    if (size) {
      const sizeValues = rows
        .map((r) => Number(r[size]))
        .filter((v) => !Number.isNaN(v));
      const sizeMin = Math.min(...sizeValues);
      const sizeMax = Math.max(...sizeValues);
      const sizeRange = sizeMax - sizeMin || 1;

      symbolSize = (val: number[]) => {
        const v = Number(val[2]);
        if (Number.isNaN(v)) return minSize;
        const normalized = (v - sizeMin) / sizeRange;
        return minSize + normalized * (maxSize - minSize);
      };
    }

    return {
      color: CHART_PALETTE,
      textStyle: CHART_TEXT_STYLE,
      grid: CHART_GRID,
      tooltip: {
        show: cfg.tooltip?.show !== false,
        trigger: cfg.tooltip?.trigger ?? "item",
        // Format as plain numbers
        formatter: (params: unknown) => {
          const p = params as { value: (number | null)[] };
          const [xVal, yVal, sizeVal] = p.value;
          const xLabel = cfg.xAxis?.label ?? x;
          const yLabel = cfg.yAxis?.label ?? y;
          let text = `${xLabel}: ${xVal?.toLocaleString() ?? "N/A"}<br/>${yLabel}: ${yVal?.toLocaleString() ?? "N/A"}`;
          if (size && sizeVal != null) {
            text += `<br/>${size}: ${sizeVal.toLocaleString()}`;
          }
          return text;
        },
      },
      xAxis: {
        type: "value" as const,
        name: cfg.xAxis?.label ?? x,
        // Scatter: auto-scale with 5% padding
        scale: true,
        min: cfg.xAxis?.min,
        max: cfg.xAxis?.max,
        ...CHART_AXIS_STYLE,
      },
      yAxis: {
        type: "value" as const,
        name: cfg.yAxis?.label ?? y,
        // Scatter: auto-scale with 5% padding
        scale: true,
        min: cfg.yAxis?.min,
        max: cfg.yAxis?.max,
        ...CHART_AXIS_STYLE,
      },
      series: [
        {
          type: "scatter" as const,
          data: scatterData,
          symbolSize,
          itemStyle: {
            shadowBlur: 3,
            shadowColor: "rgba(84, 112, 198, 0.4)",
          },
        },
      ] as EChartsOption["series"],
      // Responsive: scale points with container size
      media: [
        {
          query: { maxWidth: 300 },
          option: {
            series: [{ symbolSize: size ? symbolSize : Math.max(4, baseSize! * 0.5) }],
          },
        },
        {
          query: { minWidth: 300, maxWidth: 500 },
          option: {
            series: [{ symbolSize: size ? symbolSize : Math.max(5, baseSize! * 0.7) }],
          },
        },
        {
          query: { minWidth: 800 },
          option: {
            series: [{ symbolSize: size ? symbolSize : Math.min(16, baseSize! * 1.3) }],
          },
        },
      ],
    };
  });
}
