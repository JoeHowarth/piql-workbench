import type { Table } from "apache-arrow";
import { createPaneQueryStore, type PaneQueryState } from "./paneQueryStore";

export type ChartState = PaneQueryState;

const paneStore = createPaneQueryStore();

export function getChartState(paneId: string): ChartState {
  return paneStore.getState(paneId);
}

export function setChartQuery(paneId: string, text: string) {
  paneStore.setQuery(paneId, text);
}

export function setChartResult(
  paneId: string,
  table: Table | null,
  error: Error | null,
) {
  paneStore.setResult(paneId, table, error);
}

export function setChartLoading(paneId: string, loading: boolean) {
  paneStore.setLoading(paneId, loading);
}

export function clearChartState(paneId: string) {
  paneStore.clear(paneId);
}
