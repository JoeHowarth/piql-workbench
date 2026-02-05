import type { Table } from "apache-arrow";
import { createStore, produce } from "solid-js/store";

export interface ScatterState {
  queryText: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): ScatterState => ({
  queryText: "",
  table: null,
  error: null,
  loading: false,
});

const [store, setStore] = createStore<Record<string, ScatterState>>({});

export function getScatterState(paneId: string): ScatterState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setScatterQuery(paneId: string, text: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "queryText", text);
}

export function setScatterResult(
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

export function setScatterLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}
