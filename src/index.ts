// Components
export { DataFrameTable } from './components/DataFrameTable';
export { TableHeader } from './components/TableHeader';
export { TableBody } from './components/TableBody';
export { TableCell } from './components/TableCell';
export { ResizeHandle } from './components/ResizeHandle';
export { ColumnFilter } from './components/ColumnFilter';

// Hooks
export { useArrowData } from './hooks/useArrowData';
export { useTableState } from './hooks/useTableState';
export { useDerivedRows } from './hooks/useDerivedRows';

// Utilities
export { parseArrowBuffer, isNumericType, isTemporalType, isBooleanType } from './lib/arrow';

// Types
export type {
  SortDir,
  SortState,
  FilterValue,
  ColumnSchema,
  ColumnConfig,
  TableConfig,
  TableState,
  ParsedArrowData,
} from './lib/types';
