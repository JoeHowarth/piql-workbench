import type { Table } from "apache-arrow";
import { createStore, produce } from "solid-js/store";

export interface PaneQueryState {
  queryText: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

function defaultState(): PaneQueryState {
  return {
    queryText: "",
    table: null,
    error: null,
    loading: false,
  };
}

export function createPaneQueryStore() {
  const [store, setStore] = createStore<Record<string, PaneQueryState>>({});

  const ensure = (paneId: string) => {
    if (!store[paneId]) {
      setStore(paneId, defaultState());
    }
  };

  return {
    getState(paneId: string): PaneQueryState {
      ensure(paneId);
      return store[paneId];
    },

    setQuery(paneId: string, text: string) {
      ensure(paneId);
      setStore(paneId, "queryText", text);
    },

    setResult(paneId: string, table: Table | null, error: Error | null) {
      ensure(paneId);
      setStore(paneId, {
        table,
        error,
        loading: false,
      });
    },

    setLoading(paneId: string, loading: boolean) {
      ensure(paneId);
      setStore(paneId, "loading", loading);
    },

    clear(paneId: string) {
      setStore(produce((s) => delete s[paneId]));
    },
  };
}
