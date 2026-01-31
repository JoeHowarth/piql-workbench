import { createMemo } from 'solid-js';
import type { Accessor, Component } from 'solid-js';
import { useArrowData } from '../hooks/useArrowData';
import { useTableState } from '../hooks/useTableState';
import { useDerivedRows } from '../hooks/useDerivedRows';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import type { TableConfig } from '../lib/types';

interface Props {
  data: Accessor<ArrayBuffer | null>;
  config?: TableConfig;
  class?: string;
}

export const DataFrameTable: Component<Props> = (props) => {
  const store = useArrowData(props.data);

  // Create table state - needs to react to schema changes
  const state = createMemo(() => {
    return useTableState(store.schema, props.config);
  });

  // Derive filtered/sorted rows
  const derivedRows = createMemo(() => {
    const s = state();
    return useDerivedRows(store.rows, s.sortBy, s.filters);
  });

  // Filter out hidden columns
  const visibleColumns = createMemo(() => {
    return store.schema.filter(
      (col) => !props.config?.columns?.[col.name]?.hidden
    );
  });

  return (
    <div
      class={`overflow-auto ${props.class ?? ''}`}
      classList={{
        'relative': props.config?.stickyHeader,
      }}
    >
      <table class="w-full border-collapse text-sm">
        <TableHeader
          columns={visibleColumns()}
          config={props.config?.columns}
          state={state()}
          rows={store.rows}
        />
        <TableBody
          columns={visibleColumns()}
          rows={derivedRows()()}
          columnWidths={state().columnWidths()}
          columnConfig={props.config?.columns}
          striped={props.config?.stripedRows}
          compact={props.config?.density === 'compact'}
        />
      </table>
    </div>
  );
};
