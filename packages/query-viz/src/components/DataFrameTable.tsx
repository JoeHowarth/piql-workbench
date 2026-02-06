import type { Table } from "apache-arrow";
import type { Accessor, Component } from "solid-js";
import { createMemo } from "solid-js";
import { useArrowData } from "../hooks/useArrowData";
import { useDerivedRows } from "../hooks/useDerivedRows";
import { useTableState } from "../hooks/useTableState";
import type { TableConfig } from "../lib/types";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";

interface Props {
  table: Accessor<Table | null>;
  config?: TableConfig;
  class?: string;
}

export const DataFrameTable: Component<Props> = (props) => {
  const store = useArrowData(props.table);

  const state = useTableState(() => store.schema, props.config);
  const derivedRows = useDerivedRows(
    () => store.rows,
    state.sortBy,
    state.filters,
  );

  // Filter out hidden columns
  const visibleColumns = createMemo(() => {
    return store.schema.filter(
      (col) => !props.config?.columns?.[col.name]?.hidden,
    );
  });

  return (
    <div
      class={`overflow-auto ${props.class ?? ""}`}
      classList={{
        relative: props.config?.stickyHeader,
      }}
    >
      <table class="w-full border-collapse text-sm">
        <TableHeader
          columns={visibleColumns()}
          config={props.config?.columns}
          state={state}
          rows={store.rows}
        />
        <TableBody
          columns={visibleColumns()}
          rows={derivedRows()}
          columnWidths={state.columnWidths()}
          columnConfig={props.config?.columns}
          striped={props.config?.stripedRows}
          compact={props.config?.density === "compact"}
        />
      </table>
    </div>
  );
};
