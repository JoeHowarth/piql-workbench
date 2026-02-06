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
  const buildQueryFromQuestion = (
    question: string,
  ): { query: string; rowCount: number } => {
    const lower = question.toLowerCase();
    const dataframe = lower.includes("order")
      ? "orders"
      : lower.includes("user")
        ? "users"
        : "items";
    const countMatch = lower.match(/\b(\d+)\b/);
    const rowCount = countMatch ? Number.parseInt(countMatch[1], 10) : 25;
    const clamped = Math.max(1, Math.min(rowCount, 100));
    return {
      query: `${dataframe}.head(${clamped})`,
      rowCount: clamped,
    };
  };

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

    subscribe(query, onData, onError) {
      if (query.includes("error") || query.includes("fail")) {
        const timeout = setTimeout(() => {
          onError?.(new Error(`Subscription failed: ${query}`));
        }, 0);
        return () => clearTimeout(timeout);
      }

      const interval = setInterval(() => {
        const headMatch = query.match(/\.head\((\d+)\)/);
        const rowCount = headMatch ? parseInt(headMatch[1], 10) : 25;
        onData(createMockTable(Math.min(rowCount, 100)));
      }, 1000);

      return () => clearInterval(interval);
    },

    async ask(question, execute) {
      await new Promise((r) => setTimeout(r, 120));
      const { query, rowCount } = buildQueryFromQuestion(question);

      if (!execute) {
        return { query };
      }

      return { query, table: createMockTable(rowCount) };
    },
  };
}
