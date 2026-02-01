import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import type { FilterValue, SortState } from "../lib/types";

function matchesFilter(value: unknown, filter: FilterValue): boolean {
  if (filter === null) return true;

  // Multi-select string filter: array of allowed values
  if (Array.isArray(filter) && filter.every((v) => typeof v === "string")) {
    const strVal = String(value ?? "");
    return (filter as string[]).includes(strVal);
  }

  // Range filter for numbers: [min, max]
  if (
    Array.isArray(filter) &&
    filter.length === 2 &&
    typeof filter[0] === "number"
  ) {
    const [min, max] = filter as [number, number];
    const num = Number(value);
    if (Number.isNaN(num)) return false;
    return num >= min && num <= max;
  }

  // String filter: case-insensitive contains (legacy/fallback)
  if (typeof filter === "string") {
    const str = String(value ?? "").toLowerCase();
    return str.includes(filter.toLowerCase());
  }

  // Exact numeric match (for booleans: 1=true, 0=false)
  if (typeof filter === "number") {
    return Number(value) === filter;
  }

  return true;
}

export function useDerivedRows(
  rows: Record<string, unknown>[],
  sortBy: Accessor<SortState>,
  filters: Accessor<Record<string, FilterValue>>,
) {
  return createMemo(() => {
    let result = [...rows];

    // Apply filters
    const activeFilters = filters();
    for (const [col, filter] of Object.entries(activeFilters)) {
      if (filter === null) continue;
      result = result.filter((row) => matchesFilter(row[col], filter));
    }

    // Apply sort
    const sort = sortBy();
    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.column];
        const bVal = b[sort.column];

        // Handle nulls: push to end
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Compare values
        let cmp: number;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }

        return sort.dir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  });
}
