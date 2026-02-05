import type { Table } from "apache-arrow";
import { createStore } from "solid-js/store";

export type VizType = "table" | "bar" | "line" | "scatter";

export interface SmartVizState {
  vizType: VizType;
  question: string;
  generatedQuery: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): SmartVizState => ({
  vizType: "table",
  question: "",
  generatedQuery: "",
  table: null,
  error: null,
  loading: false,
});

const [store, setStore] = createStore<Record<string, SmartVizState>>({});

export function getSmartVizState(paneId: string): SmartVizState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setVizType(paneId: string, vizType: VizType) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "vizType", vizType);
}

export function setSmartVizQuestion(paneId: string, question: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "question", question);
}

export function setSmartVizGeneratedQuery(paneId: string, query: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "generatedQuery", query);
}

export function setSmartVizResult(
  paneId: string,
  query: string,
  table: Table | null,
  error: Error | null,
) {
  setStore(paneId, {
    generatedQuery: query,
    table,
    error,
    loading: false,
  });
}

export function setSmartVizLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}

export function clearSmartVizContext(paneId: string) {
  setStore(paneId, {
    question: "",
    generatedQuery: "",
    table: null,
    error: null,
  });
}
