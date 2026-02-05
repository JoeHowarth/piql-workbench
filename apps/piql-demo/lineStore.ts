import type { Table } from "apache-arrow";
import { createStore, produce } from "solid-js/store";

export interface LineState {
  queryText: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): LineState => ({
  queryText: "",
  table: null,
  error: null,
  loading: false,
});

const [store, setStore] = createStore<Record<string, LineState>>({});

export function getLineState(paneId: string): LineState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setLineQuery(paneId: string, text: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "queryText", text);
}

export function setLineResult(
  paneId: string,
  table: Table | null,
  error: Error | null,
) {
  setStore(paneId, {
    table,
    error,
    loading: false,
  });
}

export function setLineLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}
