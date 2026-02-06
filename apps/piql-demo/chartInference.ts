import type {
  BarChartConfig,
  ColumnSchema,
  LineChartConfig,
  ScatterChartConfig,
} from "query-viz";

function isStringLikeArrowType(type: string): boolean {
  return type === "Utf8" || type === "LargeUtf8" || type.includes("Utf8");
}

function isNumericType(type: string): boolean {
  return (
    type.startsWith("Int") ||
    type.startsWith("Uint") ||
    type.startsWith("Float") ||
    type === "Decimal"
  );
}

function isTemporalType(type: string): boolean {
  return (
    type.startsWith("Timestamp") ||
    type.startsWith("Date") ||
    type.startsWith("Time")
  );
}

export function inferBarChartConfig(
  schema: ColumnSchema[],
): BarChartConfig | null {
  const categoryCol = schema.find((col) => isStringLikeArrowType(col.type));
  const valueCol = schema.find((col) => isNumericType(col.type));

  if (!categoryCol || !valueCol) return null;

  return {
    categoryAxis: { column: categoryCol.name },
    series: [{ column: valueCol.name }],
  };
}

export function inferLineChartConfig(
  schema: ColumnSchema[],
): LineChartConfig | null {
  const xCol =
    schema.find((col) => isTemporalType(col.type)) ||
    schema.find((col) => isNumericType(col.type));
  if (!xCol) return null;

  const yCols = schema.filter(
    (col) => col.name !== xCol.name && isNumericType(col.type),
  );
  if (yCols.length === 0) return null;

  return {
    xAxis: { column: xCol.name },
    series: yCols.map((col) => ({ column: col.name })),
    smooth: true,
  };
}

export function inferScatterChartConfig(
  schema: ColumnSchema[],
): ScatterChartConfig | null {
  const numericCols = schema.filter((col) => isNumericType(col.type));
  if (numericCols.length < 2) return null;

  const config: ScatterChartConfig = {
    dimensions: {
      x: numericCols[0].name,
      y: numericCols[1].name,
    },
  };

  if (numericCols.length >= 3) {
    config.dimensions.size = numericCols[2].name;
  }

  return config;
}
