import { createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { Accessor } from 'solid-js';
import { parseArrowBuffer } from '../lib/arrow';
import type { ColumnSchema } from '../lib/types';

interface ArrowDataStore {
  schema: ColumnSchema[];
  rows: Record<string, unknown>[];
}

export function useArrowData(buffer: Accessor<ArrayBuffer | null>) {
  const [data, setData] = createStore<ArrowDataStore>({
    schema: [],
    rows: [],
  });

  createEffect(() => {
    const buf = buffer();
    if (!buf) return;

    const parsed = parseArrowBuffer(buf);
    // reconcile enables fine-grained updates - SolidJS will diff
    // and only update cells that actually changed
    setData(reconcile(parsed));
  });

  return data;
}
