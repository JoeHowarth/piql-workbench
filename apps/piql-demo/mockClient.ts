import { type Table, tableFromArrays } from "apache-arrow";
import type { PiqlClient } from "piql-client";

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

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createMockTable(rowCount: number, seed = 0): Table {
  const ids = Int32Array.from({ length: rowCount }, (_, i) => i + 1);
  const names = Array.from({ length: rowCount }, (_, i) => `Item ${i + 1}`);
  const values = Float64Array.from({ length: rowCount }, (_, i) =>
    Number((((seed + (i + 1) * 37) % 1000) / 10).toFixed(1)),
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
      await sleep(LIST_DELAY_MS);
      return ["items", "users", "orders"];
    },

    async query(query: string, signal?: AbortSignal) {
      await sleep(QUERY_DELAY_MS, signal);

      if (query.includes("error") || query.includes("fail")) {
        throw new Error(`Query failed: ${query}`);
      }

      const headMatch = query.match(/\.head\((\d+)\)/);
      const rowCount = headMatch ? parseInt(headMatch[1], 10) : 25;
      const seed = hashString(query);

      return createMockTable(Math.min(rowCount, 100), seed);
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
        const seed = hashString(query);
        onData(createMockTable(Math.min(rowCount, 100), seed));
      }, 1000);

      return () => clearInterval(interval);
    },

    async ask(question, execute, signal) {
      await sleep(ASK_DELAY_MS, signal);
      const { query, rowCount } = buildQueryFromQuestion(question);
      const seed = hashString(query);

      if (!execute) {
        return { query };
      }

      return { query, table: createMockTable(rowCount, seed) };
    },
  };
}
