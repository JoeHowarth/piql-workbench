import type { Table } from "apache-arrow";
import { createStore, produce } from "solid-js/store";

export interface ChartState {
  queryText: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): ChartState => ({
  queryText: "",
  table: null,
  error: null,
  loading: false,
});

// Store keyed by pane id
const [store, setStore] = createStore<Record<string, ChartState>>({});

export function getChartState(paneId: string): ChartState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setChartQuery(paneId: string, text: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "queryText", text);
}

export function setChartResult(
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

export function setChartLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}

export function clearChartState(paneId: string) {
  setStore(produce((s) => delete s[paneId]));
}
