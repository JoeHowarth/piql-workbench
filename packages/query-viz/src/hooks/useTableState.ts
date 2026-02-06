import type { Accessor } from "solid-js";
import { createEffect, createSignal } from "solid-js";
import type {
  ColumnSchema,
  FilterValue,
  SortState,
  TableConfig,
  TableState,
} from "../lib/types";

const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 50;

export function reconcileColumnWidths(
  previous: Record<string, number>,
  schema: ColumnSchema[],
  config?: TableConfig,
): Record<string, number> {
  const widths: Record<string, number> = {};
  for (const col of schema) {
    const colConfig = config?.columns?.[col.name];
    widths[col.name] =
      previous[col.name] ?? colConfig?.width ?? DEFAULT_COLUMN_WIDTH;
  }
  return widths;
}

export function useTableState(
  schema: Accessor<ColumnSchema[]>,
  config?: TableConfig,
): TableState {
  const [sortBy, setSortBy] = createSignal<SortState>(
    config?.defaultSort ?? null,
  );

  const [filters, setFilters] = createSignal<Record<string, FilterValue>>({});

  const [columnWidths, setColumnWidths] = createSignal<Record<string, number>>(
    reconcileColumnWidths({}, schema(), config),
  );

  createEffect(() => {
    const activeSchema = schema();
    const validColumns = new Set(activeSchema.map((col) => col.name));

    setColumnWidths((prev) =>
      reconcileColumnWidths(prev, activeSchema, config),
    );

    setFilters((prev) => {
      const next: Record<string, FilterValue> = {};
      for (const [column, value] of Object.entries(prev)) {
        if (validColumns.has(column)) {
          next[column] = value;
        }
      }
      return next;
    });

    const currentSort = sortBy();
    if (currentSort && !validColumns.has(currentSort.column)) {
      setSortBy(config?.defaultSort ?? null);
    }
  });

  const toggleSort = (column: string) => {
    setSortBy((prev) => {
      if (prev?.column !== column) return { column, dir: "asc" };
      if (prev.dir === "asc") return { column, dir: "desc" };
      return null; // Third click clears sort
    });
  };

  const setColumnWidth = (column: string, width: number) => {
    const colConfig = config?.columns?.[column];
    const minWidth = colConfig?.minWidth ?? MIN_COLUMN_WIDTH;
    const clampedWidth = Math.max(minWidth, width);

    setColumnWidths((prev) => ({
      ...prev,
      [column]: clampedWidth,
    }));
  };

  return {
    sortBy,
    toggleSort,
    filters,
    setFilters,
    columnWidths,
    setColumnWidth,
  };
}
