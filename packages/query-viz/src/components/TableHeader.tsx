import type { Component } from "solid-js";
import { createMemo, For, Show } from "solid-js";
import type { ColumnConfig, ColumnSchema, TableState } from "../lib/types";
import { ColumnFilter } from "./ColumnFilter";
import { ResizeHandle } from "./ResizeHandle";

interface Props {
  columns: ColumnSchema[];
  config?: Record<string, ColumnConfig>;
  state: TableState;
  rows: Record<string, unknown>[];
}

const SortIcon: Component<{ dir: "asc" | "desc" | null }> = (props) => {
  return (
    <span class="ml-1 inline-block w-3">
      <Show when={props.dir === "asc"}>↑</Show>
      <Show when={props.dir === "desc"}>↓</Show>
    </span>
  );
};

export const TableHeader: Component<Props> = (props) => {
  const getLabel = (col: ColumnSchema) => {
    return props.config?.[col.name]?.label ?? col.name;
  };

  const getSortDir = (colName: string) => {
    const sort = props.state.sortBy();
    if (sort?.column === colName) {
      return sort.dir;
    }
    return null;
  };

  const getAriaSort = (
    colName: string,
  ): "ascending" | "descending" | "none" => {
    const dir = getSortDir(colName);
    if (dir === "asc") return "ascending";
    if (dir === "desc") return "descending";
    return "none";
  };

  // Compute unique values per column (for multi-select filters)
  const uniqueValuesMap = createMemo(() => {
    const map: Record<string, unknown[]> = {};
    for (const col of props.columns) {
      const values = props.rows.map((row) => row[col.name]);
      map[col.name] = [...new Set(values)];
    }
    return map;
  });

  return (
    <thead class="sticky top-0 z-10">
      <tr>
        <For each={props.columns}>
          {(col) => (
            <th
              data-testid={`table-header-${col.name}`}
              aria-sort={getAriaSort(col.name)}
              class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 select-none hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              style={{
                width: `${props.state.columnWidths()[col.name] ?? 150}px`,
                "min-width": `${props.config?.[col.name]?.minWidth ?? 50}px`,
              }}
            >
              <div class="flex items-center pr-2">
                <button
                  type="button"
                  data-testid={`sort-toggle-${col.name}`}
                  aria-label={`Sort by ${getLabel(col)}`}
                  class="flex min-w-0 items-center text-left text-current hover:text-gray-900 dark:hover:text-gray-100"
                  onClick={() => props.state.toggleSort(col.name)}
                >
                  <span class="truncate">{getLabel(col)}</span>
                  <SortIcon dir={getSortDir(col.name)} />
                </button>
                <ColumnFilter
                  columnName={col.name}
                  columnType={col.type}
                  currentFilter={props.state.filters()[col.name] ?? null}
                  uniqueValues={uniqueValuesMap()[col.name]}
                  onFilterChange={(value) => {
                    const current = props.state.filters();
                    if (value === null) {
                      const { [col.name]: _, ...rest } = current;
                      props.state.setFilters(rest);
                    } else {
                      props.state.setFilters({ ...current, [col.name]: value });
                    }
                  }}
                />
              </div>
              <ResizeHandle
                testId={`column-resize-${col.name}`}
                ariaLabel={`Resize ${getLabel(col)} column`}
                onResize={(delta) => {
                  const currentWidth =
                    props.state.columnWidths()[col.name] ?? 150;
                  props.state.setColumnWidth(col.name, currentWidth + delta);
                }}
              />
            </th>
          )}
        </For>
      </tr>
    </thead>
  );
};
