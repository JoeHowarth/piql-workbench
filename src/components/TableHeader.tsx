import { For, Show, createMemo } from 'solid-js';
import type { Component } from 'solid-js';
import type { ColumnSchema, ColumnConfig, TableState } from '../lib/types';
import { ResizeHandle } from './ResizeHandle';
import { ColumnFilter } from './ColumnFilter';

interface Props {
  columns: ColumnSchema[];
  config?: Record<string, ColumnConfig>;
  state: TableState;
  rows: Record<string, unknown>[];
}

const SortIcon: Component<{ dir: 'asc' | 'desc' | null }> = (props) => {
  return (
    <span class="ml-1 inline-block w-3">
      <Show when={props.dir === 'asc'}>↑</Show>
      <Show when={props.dir === 'desc'}>↓</Show>
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

  // Compute unique values per column (for multi-select filters)
  const uniqueValuesMap = createMemo(() => {
    const map: Record<string, unknown[]> = {};
    for (const col of props.columns) {
      const values = props.rows.map(row => row[col.name]);
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
              class="px-3 py-2 text-left font-medium text-gray-700 bg-gray-50 border-b border-gray-200 cursor-pointer select-none hover:bg-gray-100 relative"
              style={{
                width: `${props.state.columnWidths()[col.name] ?? 150}px`,
                'min-width': `${props.config?.[col.name]?.minWidth ?? 50}px`,
              }}
              onClick={() => props.state.toggleSort(col.name)}
            >
              <div class="flex items-center pr-2">
                <span class="truncate">{getLabel(col)}</span>
                <SortIcon dir={getSortDir(col.name)} />
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
                onResize={(delta) => {
                  const currentWidth = props.state.columnWidths()[col.name] ?? 150;
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
