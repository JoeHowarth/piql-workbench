import { type Table, tableFromArrays } from "apache-arrow";
import type { PiqlClient } from "piql-client";

function createMockTable(rowCount: number): Table {
  const ids = Int32Array.from({ length: rowCount }, (_, i) => i + 1);
  const names = Array.from({ length: rowCount }, (_, i) => `Item ${i + 1}`);
  const values = Float64Array.from(
    { length: rowCount },
    () => Math.round(Math.random() * 1000) / 10,
  );

  return tableFromArrays({ id: ids, name: names, value: values });
}

export function createMockClient(): PiqlClient {
  return {
    async listDataframes() {
      await new Promise((r) => setTimeout(r, 100));
      return ["items", "users", "orders"];
    },

    async query(query: string) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

      if (query.includes("error") || query.includes("fail")) {
        throw new Error(`Query failed: ${query}`);
      }

      const headMatch = query.match(/\.head\((\d+)\)/);
      const rowCount = headMatch ? parseInt(headMatch[1], 10) : 25;

      return createMockTable(Math.min(rowCount, 100));
    },

    subscribe(query, onData) {
      let tick = 0;
      const interval = setInterval(() => {
        const headMatch = query.match(/\.head\((\d+)\)/);
        const rowCount = headMatch ? parseInt(headMatch[1], 10) : 25;
        onData(createMockTable(Math.min(rowCount, 100)));
        tick++;
      }, 1000);

      return () => clearInterval(interval);
    },
  };
}
