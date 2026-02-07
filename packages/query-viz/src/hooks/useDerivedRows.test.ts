import { describe, expect, it } from "bun:test";
import { createRoot, createSignal } from "solid-js";
import type { FilterValue, SortState } from "../lib/types";
import { useDerivedRows } from "./useDerivedRows";

describe("useDerivedRows sorting semantics", () => {
  it("sorts bigint values numerically", () => {
    createRoot((dispose) => {
      const [rows] = createSignal<Record<string, unknown>[]>([
        { amount: 10n },
        { amount: 2n },
        { amount: 1n },
      ]);
      const [sortBy] = createSignal<SortState>({
        column: "amount",
        dir: "asc",
      });
      const [filters] = createSignal<Record<string, FilterValue>>({});

      const derived = useDerivedRows(rows, sortBy, filters);
      const ordered = derived().map((row) => row.amount);
      expect(ordered).toEqual([1n, 2n, 10n]);

      dispose();
    });
  });

  it("sorts Date values chronologically", () => {
    createRoot((dispose) => {
      const [rows] = createSignal<Record<string, unknown>[]>([
        { updated_at: new Date("2026-01-04T00:00:00.000Z") },
        { updated_at: new Date("2026-01-02T00:00:00.000Z") },
        { updated_at: new Date("2026-01-03T00:00:00.000Z") },
      ]);
      const [sortBy] = createSignal<SortState>({
        column: "updated_at",
        dir: "asc",
      });
      const [filters] = createSignal<Record<string, FilterValue>>({});

      const derived = useDerivedRows(rows, sortBy, filters);
      const ordered = derived().map((row) => row.updated_at as Date);

      expect(ordered[0].toISOString()).toBe("2026-01-02T00:00:00.000Z");
      expect(ordered[1].toISOString()).toBe("2026-01-03T00:00:00.000Z");
      expect(ordered[2].toISOString()).toBe("2026-01-04T00:00:00.000Z");

      dispose();
    });
  });

  it("keeps nulls at the end when sorting descending", () => {
    createRoot((dispose) => {
      const [rows] = createSignal<Record<string, unknown>[]>([
        { amount: 4 },
        { amount: null },
        { amount: 2 },
      ]);
      const [sortBy] = createSignal<SortState>({
        column: "amount",
        dir: "desc",
      });
      const [filters] = createSignal<Record<string, FilterValue>>({});

      const derived = useDerivedRows(rows, sortBy, filters);
      const ordered = derived().map((row) => row.amount);
      expect(ordered).toEqual([4, 2, null]);

      dispose();
    });
  });
});
