import type { Table } from "apache-arrow";
import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import { parseArrowTable } from "../lib/arrow";
import type { ColumnSchema, ParsedArrowData } from "../lib/types";

const EMPTY_DATA: ParsedArrowData = { schema: [], rows: [] };

/**
 * Reactive memo that parses Arrow Table into schema + rows for rendering.
 * Returns a memoized ParsedArrowData that updates when the table changes.
 */
export function useArrowData(table: Accessor<Table | null>): ParsedArrowData {
  const parsed = createMemo((): ParsedArrowData => {
    const t = table();
    if (!t) return EMPTY_DATA;
    return parseArrowTable(t);
  });

  // Return a proxy that accesses the memo
  // This maintains the same API as before (data.schema, data.rows)
  return {
    get schema() {
      return parsed().schema;
    },
    get rows() {
      return parsed().rows;
    },
  };
}
