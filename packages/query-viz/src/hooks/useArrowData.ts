import type { Table } from "apache-arrow";
import type { Accessor } from "solid-js";
import { createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { parseArrowTable } from "../lib/arrow";
import type { ColumnSchema } from "../lib/types";

interface ArrowDataStore {
  schema: ColumnSchema[];
  rows: Record<string, unknown>[];
}

/**
 * Reactive store that parses Arrow Table into rows for rendering.
 * Uses SolidJS reconcile for fine-grained updates - only cells that
 * actually changed will re-render.
 */
export function useArrowData(table: Accessor<Table | null>) {
  const [data, setData] = createStore<ArrowDataStore>({
    schema: [],
    rows: [],
  });

  createEffect(() => {
    const t = table();
    if (!t) return;

    const parsed = parseArrowTable(t);
    // reconcile enables fine-grained updates - SolidJS will diff
    // and only update cells that actually changed
    setData(reconcile(parsed));
  });

  return data;
}
