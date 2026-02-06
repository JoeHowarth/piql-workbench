import type { Table } from "apache-arrow";
import { createPaneQueryStore, type PaneQueryState } from "./paneQueryStore";

export type LineState = PaneQueryState;

const paneStore = createPaneQueryStore();

export function getLineState(paneId: string): LineState {
  return paneStore.getState(paneId);
}

export function setLineQuery(paneId: string, text: string) {
  paneStore.setQuery(paneId, text);
}

export function setLineResult(
  paneId: string,
  table: Table | null,
  error: Error | null,
) {
  paneStore.setResult(paneId, table, error);
}

export function setLineLoading(paneId: string, loading: boolean) {
  paneStore.setLoading(paneId, loading);
}
