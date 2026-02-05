import type { Table } from "apache-arrow";
import { createStore, produce } from "solid-js/store";

export interface AskState {
  question: string;
  generatedQuery: string;
  table: Table | null;
  error: Error | null;
  loading: boolean;
}

const defaultState = (): AskState => ({
  question: "",
  generatedQuery: "",
  table: null,
  error: null,
  loading: false,
});

const [store, setStore] = createStore<Record<string, AskState>>({});

export function getAskState(paneId: string): AskState {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  return store[paneId];
}

export function setQuestion(paneId: string, question: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "question", question);
}

export function setGeneratedQuery(paneId: string, query: string) {
  if (!store[paneId]) {
    setStore(paneId, defaultState());
  }
  setStore(paneId, "generatedQuery", query);
}

export function setAskResult(
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

export function setAskLoading(paneId: string, loading: boolean) {
  setStore(paneId, "loading", loading);
}
