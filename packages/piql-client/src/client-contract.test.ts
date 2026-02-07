import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { type Table, tableFromArrays, tableToIPC } from "apache-arrow";
import { createPiqlClient } from "./client";

const makeTable = (rowCount: number): Table =>
  tableFromArrays({
    id: Int32Array.from({ length: rowCount }, (_, i) => i + 1),
    value: Float64Array.from({ length: rowCount }, (_, i) => i + 0.5),
  });

const toBytes = (rowCount: number): Uint8Array =>
  tableToIPC(makeTable(rowCount));

const toBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");
const toBody = (rowCount: number): ArrayBuffer => {
  const bytes = toBytes(rowCount);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
};

interface FetchCall {
  body: string;
  method: string;
  url: string;
}

let fetchCalls: FetchCall[] = [];
let originalFetch: typeof fetch;
let originalEventSource: typeof EventSource;

class MockEventSource {
  static instances: MockEventSource[] = [];

  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  onmessage: ((this: EventSource, ev: MessageEvent<string>) => unknown) | null =
    null;
  readonly url: string;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  emitTable(rowCount: number) {
    this.onmessage?.call(
      this as unknown as EventSource,
      { data: toBase64(toBytes(rowCount)) } as MessageEvent<string>,
    );
  }

  emitError() {
    this.onerror?.call(this as unknown as EventSource, new Event("error"));
  }
}

beforeEach(() => {
  fetchCalls = [];
  MockEventSource.instances = [];
  originalFetch = globalThis.fetch;
  originalEventSource = globalThis.EventSource;

  globalThis.fetch = (async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method =
      init?.method ??
      (typeof input === "string" || input instanceof URL
        ? "GET"
        : input.method);
    const body = typeof init?.body === "string" ? init.body : "";
    fetchCalls.push({ url, method, body });

    if (url.endsWith("/dataframes")) {
      return new Response(JSON.stringify({ names: ["orders", "inventory"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.endsWith("/query")) {
      if (body.includes("slow")) {
        return await new Promise<Response>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve(new Response(toBody(3), { status: 200 }));
          }, 200);

          init?.signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout);
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
      }

      return new Response(toBody(3), { status: 200 });
    }

    if (url.includes("/ask")) {
      const headers = new Headers({
        "X-Piql-Query": "orders.head(2)",
      });
      if (url.includes("execute=true")) {
        return new Response(toBody(2), { status: 200, headers });
      }
      return new Response("", { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.EventSource = originalEventSource;
});

describe("createPiqlClient contract", () => {
  it("exposes full PiqlClient method surface", () => {
    const client = createPiqlClient("http://piql.test");

    expect(typeof client.listDataframes).toBe("function");
    expect(typeof client.query).toBe("function");
    expect(typeof client.ask).toBe("function");
    expect(typeof client.subscribe).toBe("function");
  });

  it("supports listDataframes/query/ask contracts", async () => {
    const client = createPiqlClient("http://piql.test");

    const names = await client.listDataframes();
    expect(names).toEqual(["orders", "inventory"]);

    const table = await client.query("orders.head(3)");
    expect(table.numRows).toBe(3);

    const noExec = await client.ask("show orders", false);
    expect(noExec.query).toBe("orders.head(2)");
    expect(noExec.table).toBeUndefined();

    const withExec = await client.ask("show orders", true);
    expect(withExec.query).toBe("orders.head(2)");
    expect(withExec.table).toBeDefined();
    expect(withExec.table!.numRows).toBe(2);

    const queryCall = fetchCalls.find((call) => call.url.endsWith("/query"));
    expect(queryCall?.method).toBe("POST");
    expect(queryCall?.body).toBe("orders.head(3)");
  });

  it("subscribes to SSE data and reports connection errors", () => {
    const client = createPiqlClient("http://piql.test");
    let receivedRows = 0;
    let receivedError: Error | null = null;

    const unsubscribe = client.subscribe(
      "orders.head(5)",
      (table) => {
        receivedRows = table.numRows;
      },
      (error) => {
        receivedError = error;
      },
    );

    const source = MockEventSource.instances.at(-1);
    expect(source).toBeDefined();

    source!.emitTable(5);
    expect(receivedRows).toBe(5);

    source!.emitError();
    expect(receivedError).not.toBeNull();
    expect(receivedError!.message).toContain("SSE connection error");

    unsubscribe();
    expect(source!.closed).toBe(true);
  });

  it("aborts query when the signal is canceled", async () => {
    const client = createPiqlClient("http://piql.test");
    const controller = new AbortController();

    const pending = client.query("slow.head(3)", controller.signal);
    controller.abort();

    await expect(pending).rejects.toThrow("Aborted");
  });
});
