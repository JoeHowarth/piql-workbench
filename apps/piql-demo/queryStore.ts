import type { Table } from "apache-arrow";
import { createPaneQueryStore, type PaneQueryState } from "./paneQueryStore";

export type QueryState = PaneQueryState;

const paneStore = createPaneQueryStore();

export function getQueryState(paneId: string): QueryState {
  return paneStore.getState(paneId);
}

export function setQueryText(paneId: string, text: string) {
  paneStore.setQuery(paneId, text);
}

export function setQueryResult(
  paneId: string,
  table: Table | null,
  error: Error | null,
) {
  paneStore.setResult(paneId, table, error);
}

export function setQueryLoading(paneId: string, loading: boolean) {
  paneStore.setLoading(paneId, loading);
}

export function clearQueryState(paneId: string) {
  paneStore.clear(paneId);
}
