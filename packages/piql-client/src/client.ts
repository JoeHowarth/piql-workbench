import { type Table, tableFromIPC } from "apache-arrow";
import createClient from "openapi-fetch";
import type { paths } from "./api";

export type PiqlClient = ReturnType<typeof createPiqlClient>;

export function createPiqlClient(baseUrl: string) {
  const api = createClient<paths>({ baseUrl });

  return {
    /** List available dataframes */
    async listDataframes(): Promise<string[]> {
      const { data, error } = await api.GET("/dataframes");
      if (error) throw new Error("Failed to list dataframes");
      return data.names;
    },

    /** Execute a one-off query, returns Arrow Table */
    async query(query: string, signal?: AbortSignal): Promise<Table> {
      const res = await fetch(`${baseUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Query failed");
      }

      const buffer = await res.arrayBuffer();
      return tableFromIPC(new Uint8Array(buffer));
    },

    /** Subscribe to query results via SSE */
    subscribe(
      query: string,
      onData: (table: Table) => void,
      onError?: (error: Error) => void,
    ): () => void {
      const url = `${baseUrl}/subscribe?query=${encodeURIComponent(query)}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const bytes = Uint8Array.from(atob(event.data), (c) => c.charCodeAt(0));
        const table = tableFromIPC(bytes);
        onData(table);
      };

      eventSource.onerror = () => {
        onError?.(new Error("SSE connection error"));
      };

      return () => eventSource.close();
    },

    /** Natural language to PiQL query */
    async ask(
      question: string,
      execute?: boolean,
      signal?: AbortSignal,
    ): Promise<{ query: string; table?: Table }> {
      const url = execute ? `${baseUrl}/ask?execute=true` : `${baseUrl}/ask`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: question,
        signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Ask failed");
      }

      const rawQuery = res.headers.get("X-Piql-Query") ?? "";
      const query = rawQuery.replaceAll("\\n", "\n");

      if (execute) {
        const buffer = await res.arrayBuffer();
        const table = tableFromIPC(new Uint8Array(buffer));
        return { query, table };
      }

      return { query };
    },
  };
}
