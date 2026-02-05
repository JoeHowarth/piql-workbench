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

// Convert bigint timestamps to JS Date
function toChartValue(value: unknown): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return new Date(Number(value));
  if (typeof value === "number") return value;
  return String(value);
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
        min: cfg.xAxis.min,
        max: cfg.xAxis.max,
      },
      yAxis: yAxes,
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
    };
    const valueAxisConfig = {
      type: "value" as const,
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
    const [minSize, maxSize] = cfg.sizeRange ?? [5, 30];

    // Build scatter data points
    const scatterData = rows.map((r) => {
      const point = [toChartValue(r[x]), toChartValue(r[y])];
      if (size) point.push(toChartValue(r[size]));
      return point;
    });

    // Calculate size normalization if size dimension is present
    let symbolSize: number | ((val: number[]) => number) = 10;
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
      },
      xAxis: {
        type: "value" as const,
        name: cfg.xAxis?.label ?? x,
        min: cfg.xAxis?.min,
        max: cfg.xAxis?.max,
      },
      yAxis: {
        type: "value" as const,
        name: cfg.yAxis?.label ?? y,
        min: cfg.yAxis?.min,
        max: cfg.yAxis?.max,
      },
      series: [
        {
          type: "scatter" as const,
          data: scatterData,
          symbolSize,
        },
      ] as EChartsOption["series"],
    };
  });
}
