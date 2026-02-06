import { describe, expect, it } from "bun:test";
import type { ColumnSchema } from "query-viz";
import {
  inferBarChartConfig,
  inferLineChartConfig,
  inferScatterChartConfig,
} from "./chartInference";

const schema = (columns: Array<[name: string, type: string]>): ColumnSchema[] =>
  columns.map(([name, type]) => ({ name, type, nullable: true }));

describe("chart inference", () => {
  it("infers bar config from string + numeric columns", () => {
    const config = inferBarChartConfig(
      schema([
        ["category", "Dictionary<Int32, Utf8>"],
        ["value", "Int64"],
      ]),
    );

    expect(config).toEqual({
      categoryAxis: { column: "category" },
      series: [{ column: "value" }],
    });
  });

  it("prefers temporal column for line x-axis", () => {
    const config = inferLineChartConfig(
      schema([
        ["ts", "Timestamp(Millisecond, None)"],
        ["open", "Float64"],
        ["close", "Float64"],
      ]),
    );

    expect(config?.xAxis.column).toBe("ts");
    expect(config?.series.map((s) => s.column)).toEqual(["open", "close"]);
  });

  it("infers scatter dimensions from first numeric columns", () => {
    const config = inferScatterChartConfig(
      schema([
        ["x", "Int64"],
        ["y", "Float64"],
        ["size", "Uint32"],
      ]),
    );

    expect(config?.dimensions).toEqual({ x: "x", y: "y", size: "size" });
  });
});
