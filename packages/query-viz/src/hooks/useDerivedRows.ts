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

function toTimeMs(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  if (typeof value === "string") {
    // Avoid treating arbitrary strings like "1" as dates.
    if (!/[T:-]/.test(value)) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function compareValues(aVal: unknown, bVal: unknown): number {
  if (typeof aVal === "bigint" && typeof bVal === "bigint") {
    if (aVal === bVal) return 0;
    return aVal < bVal ? -1 : 1;
  }

  const aTime = toTimeMs(aVal);
  const bTime = toTimeMs(bVal);
  if (aTime !== null && bTime !== null) {
    return aTime - bTime;
  }

  if (
    (typeof aVal === "number" || typeof aVal === "bigint") &&
    (typeof bVal === "number" || typeof bVal === "bigint")
  ) {
    return Number(aVal) - Number(bVal);
  }

  if (typeof aVal === "boolean" && typeof bVal === "boolean") {
    return Number(aVal) - Number(bVal);
  }

  return String(aVal).localeCompare(String(bVal));
}

export function useDerivedRows(
  rows: Accessor<Record<string, unknown>[]>,
  sortBy: Accessor<SortState>,
  filters: Accessor<Record<string, FilterValue>>,
) {
  return createMemo(() => {
    let result = [...rows()];

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

        const cmp = compareValues(aVal, bVal);

        return sort.dir === "asc" ? cmp : -cmp;
      });
    }

    // Limit to 1000 rows for performance
    return result.slice(0, 1000);
  });
}
