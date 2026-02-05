import type { Table } from "apache-arrow";
import { createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";

export interface QueryState {
  queryText: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): QueryState => ({
  queryText: "",
  table: null,
  error: null,
  loading: false,
});

// Store keyed by pane id
const [store, setStore] = createStore<Record<string, QueryState>>({});

export function getQueryState(paneId: string): QueryState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setQueryText(paneId: string, text: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "queryText", text);
}

export function setQueryResult(paneId: string, table: Table | null, error: Error | null) {
  setStore(paneId, {
    table,
    error,
    loading: false,
  });
}

export function setQueryLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}

export function clearQueryState(paneId: string) {
  setStore(produce((s) => delete s[paneId]));
}
