import type { Accessor } from 'solid-js';

export type SortDir = 'asc' | 'desc';
export type SortState = { column: string; dir: SortDir } | null;
export type FilterValue = string | string[] | number | [number, number] | null;

export interface ColumnSchema {
  name: string;
  type: string; // Arrow type as string: 'Int64', 'Float64', 'Utf8', 'Timestamp', 'Bool', etc.
  nullable: boolean;
}

export interface ColumnConfig {
  label?: string;
  hidden?: boolean;
  width?: number;
  minWidth?: number;
  /** For boolean columns: 'checkmark' (default) or 'text' */
  booleanDisplay?: 'checkmark' | 'text';
  /** For string columns: map values to Tailwind text color classes */
  statusColors?: Record<string, string>;
}

export interface TableConfig {
  columns?: Record<string, ColumnConfig>;
  defaultSort?: { column: string; dir: SortDir };
  stickyHeader?: boolean;
  /** Alternating row colors. Default: true */
  stripedRows?: boolean;
  /** Row density. Default: 'default' */
  density?: 'compact' | 'default';
}

export interface TableState {
  sortBy: Accessor<SortState>;
  toggleSort: (column: string) => void;
  filters: Accessor<Record<string, FilterValue>>;
  setFilters: (filters: Record<string, FilterValue>) => void;
  columnWidths: Accessor<Record<string, number>>;
  setColumnWidth: (column: string, width: number) => void;
}

export interface ParsedArrowData {
  schema: ColumnSchema[];
  rows: Record<string, unknown>[];
}
