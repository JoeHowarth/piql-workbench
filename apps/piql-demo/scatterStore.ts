import type { Table } from "apache-arrow";
import { createPaneQueryStore, type PaneQueryState } from "./paneQueryStore";

export type ScatterState = PaneQueryState;

const paneStore = createPaneQueryStore();

export function getScatterState(paneId: string): ScatterState {
  return paneStore.getState(paneId);
}

export function setScatterQuery(paneId: string, text: string) {
  paneStore.setQuery(paneId, text);
}

export function setScatterResult(
  paneId: string,
  table: Table | null,
  error: Error | null,
) {
  paneStore.setResult(paneId, table, error);
}

export function setScatterLoading(paneId: string, loading: boolean) {
  paneStore.setLoading(paneId, loading);
}
