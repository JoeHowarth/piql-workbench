import { describe, expect, it } from "bun:test";
import { createRoot, createSignal } from "solid-js";
import { useDerivedRows } from "./useDerivedRows";

describe("useDerivedRows performance", () => {
  it("derives sorted rows from a large dataset within budget", () => {
    const rows = Array.from({ length: 50_000 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: 50_000 - i,
    }));

    createRoot((dispose) => {
      const [rowsSignal] = createSignal(rows);
      const [sortBy] = createSignal<{ column: string; dir: "asc" | "desc" }>({
        column: "value",
        dir: "asc",
      });
      const [filters] = createSignal({});

      const derived = useDerivedRows(rowsSignal, sortBy, filters);
      const start = performance.now();
      const result = derived();
      const durationMs = performance.now() - start;

      expect(result).toHaveLength(1000);
      expect(result[0].value).toBe(1);
      expect(durationMs).toBeLessThan(1500);

      dispose();
    });
  });
});
