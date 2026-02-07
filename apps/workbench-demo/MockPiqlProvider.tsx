import type { Table } from "apache-arrow";
import type { PiqlClient } from "piql-client";
import { createContext, type JSX, useContext } from "solid-js";
import { createMockTable } from "./mockData";

const LIST_DELAY_MS = 100;
const QUERY_DELAY_MS = 350;
const ASK_DELAY_MS = 120;

const createAbortError = () => new DOMException("Aborted", "AbortError");

function sleep(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

const resolveRowCount = (input: string): number => {
  const countMatch = input.match(/\b(\d+)\b/);
  const count = countMatch ? Number.parseInt(countMatch[1], 10) : 25;
  return Math.max(1, Math.min(count, 100));
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildQueryFromQuestion = (question: string): string => {
  const lower = question.toLowerCase();
  const dataset = lower.includes("inventory")
    ? "inventory"
    : lower.includes("shipment")
      ? "shipments"
      : "orders";
  return `${dataset}.head(${resolveRowCount(question)})`;
};

export const workbenchMockClient: PiqlClient = {
  async listDataframes() {
    await sleep(LIST_DELAY_MS);
    return ["orders", "inventory", "shipments"];
  },

  async query(query: string, signal?: AbortSignal): Promise<Table> {
    // Simulate network delay
    await sleep(QUERY_DELAY_MS, signal);

    // Parse simple patterns from query to vary response
    const rowCount = resolveRowCount(query);

    // Simulate errors for certain queries
    if (query.includes("error") || query.includes("fail")) {
      throw new Error(`Query failed: ${query}`);
    }

    return createMockTable(rowCount, hashString(query));
  },

  subscribe(query, onData, onError) {
    if (query.includes("error") || query.includes("fail")) {
      const timeout = setTimeout(() => {
        onError?.(new Error(`Subscription failed: ${query}`));
      }, 0);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      onData(createMockTable(resolveRowCount(query), hashString(query)));
    }, 1000);

    return () => clearInterval(interval);
  },

  async ask(question, execute, signal) {
    await sleep(ASK_DELAY_MS, signal);
    const query = buildQueryFromQuestion(question);
    const seed = hashString(query);

    if (!execute) {
      return { query };
    }

    return { query, table: createMockTable(resolveRowCount(question), seed) };
  },
};

const MockPiqlContext = createContext<PiqlClient>();

interface MockPiqlProviderProps {
  url?: string; // Ignored, for API compatibility with real provider
  children: JSX.Element;
}

export function MockPiqlProvider(props: MockPiqlProviderProps) {
  return (
    <MockPiqlContext.Provider value={workbenchMockClient}>
      {props.children}
    </MockPiqlContext.Provider>
  );
}

// Re-export a hook that matches the real one's signature
export function usePiqlClient() {
  const client = useContext(MockPiqlContext);
  if (!client) {
    throw new Error("usePiqlClient must be used within a MockPiqlProvider");
  }
  return client;
}
