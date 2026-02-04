import type { Table } from "apache-arrow";
import type { PiqlClient } from "piql-client";
import { createContext, type JSX, useContext } from "solid-js";
import { createMockTable } from "./mockData";

// Minimal mock that implements just what QueryTile needs
const mockClient: Pick<PiqlClient, "query" | "connected"> = {
  connected: true,

  async query(query: string): Promise<Table> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

    // Parse simple patterns from query to vary response
    const headMatch = query.match(/\.head\((\d+)\)/);
    const rowCount = headMatch ? parseInt(headMatch[1], 10) : 25;

    // Simulate errors for certain queries
    if (query.includes("error") || query.includes("fail")) {
      throw new Error(`Query failed: ${query}`);
    }

    return createMockTable(Math.min(rowCount, 100));
  },
};

const MockPiqlContext = createContext<typeof mockClient>();

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
  return client as PiqlClient;
}
