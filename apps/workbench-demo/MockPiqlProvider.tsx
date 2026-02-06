import type { Table } from "apache-arrow";
import type { PiqlClient } from "piql-client";
import { createContext, type JSX, useContext } from "solid-js";
import { createMockTable } from "./mockData";

const resolveRowCount = (input: string): number => {
  const countMatch = input.match(/\b(\d+)\b/);
  const count = countMatch ? Number.parseInt(countMatch[1], 10) : 25;
  return Math.max(1, Math.min(count, 100));
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

const mockClient: PiqlClient = {
  async listDataframes() {
    await new Promise((r) => setTimeout(r, 100));
    return ["orders", "inventory", "shipments"];
  },

  async query(query: string): Promise<Table> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    // Parse simple patterns from query to vary response
    const rowCount = resolveRowCount(query);

    // Simulate errors for certain queries
    if (query.includes("error") || query.includes("fail")) {
      throw new Error(`Query failed: ${query}`);
    }

    return createMockTable(rowCount);
  },

  subscribe(query, onData) {
    const interval = setInterval(() => {
      onData(createMockTable(resolveRowCount(query)));
    }, 1000);

    return () => clearInterval(interval);
  },

  async ask(question, execute) {
    await new Promise((r) => setTimeout(r, 120));
    const query = buildQueryFromQuestion(question);

    if (!execute) {
      return { query };
    }

    return { query, table: createMockTable(resolveRowCount(question)) };
  },
};

const MockPiqlContext = createContext<PiqlClient>();

interface MockPiqlProviderProps {
  url?: string; // Ignored, for API compatibility with real provider
  children: JSX.Element;
}

export function MockPiqlProvider(props: MockPiqlProviderProps) {
  return (
    <MockPiqlContext.Provider value={mockClient}>
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
