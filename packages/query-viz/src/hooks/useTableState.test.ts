import { describe, expect, it } from "bun:test";
import type { ColumnSchema, TableConfig } from "../lib/types";
import { reconcileColumnWidths } from "./useTableState";

const schema = (names: string[]): ColumnSchema[] =>
  names.map((name) => ({ name, type: "Utf8", nullable: true }));

describe("reconcileColumnWidths", () => {
  it("preserves existing widths and drops removed columns", () => {
    const previous = { id: 90, name: 210, removed: 300 };
    const next = reconcileColumnWidths(previous, schema(["id", "name"]));

    expect(next).toEqual({ id: 90, name: 210 });
  });

  it("assigns defaults for new columns", () => {
    const previous = { id: 80 };
    const next = reconcileColumnWidths(previous, schema(["id", "price"]));

    expect(next.id).toBe(80);
    expect(next.price).toBe(150);
  });

  it("uses configured width for newly added columns", () => {
    const config: TableConfig = {
      columns: {
        status: { width: 260 },
      },
    };

    const next = reconcileColumnWidths({}, schema(["status"]), config);
    expect(next).toEqual({ status: 260 });
  });
});
