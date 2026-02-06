import { describe, expect, it } from "bun:test";
import { tableFromArrays } from "apache-arrow";
import { createRoot, createSignal } from "solid-js";
import type { BarChartConfig } from "../lib/chartTypes";
import { useBarChartOptions } from "./useChartSeries";

describe("useBarChartOptions", () => {
  it("should generate options from Arrow table with string + numeric columns", () => {
    // Create a mock Arrow table
    const table = tableFromArrays({
      tx_type: ["trade", "reward", "loot"],
      total_amount: [61250, 63750, 65000],
    });

    console.log(
      "Test table schema:",
      table.schema.fields.map((f) => ({ name: f.name, type: String(f.type) })),
    );
    console.log("Test table numRows:", table.numRows);

    const config: BarChartConfig = {
      categoryAxis: { column: "tx_type" },
      series: [{ column: "total_amount" }],
    };

    let result: ReturnType<typeof useBarChartOptions> | undefined;

    // Run in a reactive context
    createRoot((dispose) => {
      const [tableSignal] = createSignal(table);
      const [configSignal] = createSignal(config);

      result = useBarChartOptions(tableSignal, configSignal);

      // Access the memo to trigger computation
      const options = result();
      console.log("Generated options:", JSON.stringify(options, null, 2));

      expect(options).not.toBeNull();
      expect(options?.xAxis).toBeDefined();
      expect(options?.series).toBeDefined();

      // Check category axis has correct data
      const xAxis = options?.xAxis as { data?: string[] };
      expect(xAxis.data).toEqual(["trade", "reward", "loot"]);

      // Check series has correct data
      const series = options?.series as Array<{ data: number[] }>;
      expect(series[0].data).toEqual([61250, 63750, 65000]);

      dispose();
    });
  });

  it("should return null for empty table", () => {
    const table = tableFromArrays({
      tx_type: [] as string[],
      total_amount: [] as number[],
    });

    const config: BarChartConfig = {
      categoryAxis: { column: "tx_type" },
      series: [{ column: "total_amount" }],
    };

    createRoot((dispose) => {
      const [tableSignal] = createSignal(table);
      const [configSignal] = createSignal(config);

      const result = useBarChartOptions(tableSignal, configSignal);
      const options = result();

      console.log("Empty table options:", options);
      expect(options).toBeNull();

      dispose();
    });
  });

  it("should handle null table", () => {
    const config: BarChartConfig = {
      categoryAxis: { column: "tx_type" },
      series: [{ column: "total_amount" }],
    };

    createRoot((dispose) => {
      const [tableSignal] = createSignal<ReturnType<
        typeof tableFromArrays
      > | null>(null);
      const [configSignal] = createSignal(config);

      const result = useBarChartOptions(tableSignal, configSignal);
      const options = result();

      console.log("Null table options:", options);
      expect(options).toBeNull();

      dispose();
    });
  });

  it("keeps bigint measure columns numeric in bar series", () => {
    const table = tableFromArrays({
      tx_type: ["trade", "reward"],
      total_amount: BigInt64Array.from([10n, 20n]),
    });

    const config: BarChartConfig = {
      categoryAxis: { column: "tx_type" },
      series: [{ column: "total_amount" }],
    };

    createRoot((dispose) => {
      const [tableSignal] = createSignal(table);
      const [configSignal] = createSignal(config);

      const result = useBarChartOptions(tableSignal, configSignal);
      const options = result();
      expect(options).not.toBeNull();

      const series = options?.series as Array<{ data: unknown[] }>;
      expect(series[0].data).toEqual([10, 20]);
      expect(series[0].data[0]).not.toBeInstanceOf(Date);

      dispose();
    });
  });

  it("generates bar options for large datasets within budget", () => {
    const rowCount = 20_000;
    const table = tableFromArrays({
      tx_type: Array.from({ length: rowCount }, (_, i) => `cat-${i + 1}`),
      total_amount: Float64Array.from({ length: rowCount }, (_, i) => i + 0.25),
    });

    const config: BarChartConfig = {
      categoryAxis: { column: "tx_type" },
      series: [{ column: "total_amount" }],
    };

    createRoot((dispose) => {
      const [tableSignal] = createSignal(table);
      const [configSignal] = createSignal(config);

      const result = useBarChartOptions(tableSignal, configSignal);
      const start = performance.now();
      const options = result();
      const durationMs = performance.now() - start;

      expect(options).not.toBeNull();
      const xAxis = options?.xAxis as { data?: string[] };
      expect(xAxis.data).toHaveLength(rowCount);
      expect(durationMs).toBeLessThan(1500);

      dispose();
    });
  });
});
