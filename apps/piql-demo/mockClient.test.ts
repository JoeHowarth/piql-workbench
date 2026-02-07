import { describe, expect, it } from "bun:test";
import { createMockClient } from "./mockClient";

describe("createMockClient", () => {
  it("implements full PiqlClient method surface", () => {
    const client = createMockClient();

    expect(typeof client.listDataframes).toBe("function");
    expect(typeof client.query).toBe("function");
    expect(typeof client.ask).toBe("function");
    expect(typeof client.subscribe).toBe("function");
  });

  it("lists dataframes and executes query", async () => {
    const client = createMockClient();

    const names = await client.listDataframes();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);

    const table = await client.query("items.head(4)");
    expect(table.numRows).toBe(4);
  });

  it("returns deterministic results for repeated identical queries", async () => {
    const client = createMockClient();

    const first = await client.query("items.head(6)");
    const second = await client.query("items.head(6)");

    const firstRows = first.toArray().map((row) => row.toJSON());
    const secondRows = second.toArray().map((row) => row.toJSON());
    expect(secondRows).toEqual(firstRows);
  });

  it("implements ask without execution", async () => {
    const client = createMockClient();
    const result = await client.ask("show me items", false);

    expect(typeof result.query).toBe("string");
    expect(result.query.length).toBeGreaterThan(0);
    expect(result.table).toBeUndefined();
  });

  it("implements ask with execution", async () => {
    const client = createMockClient();
    const result = await client.ask("show top 10 orders", true);

    expect(typeof result.query).toBe("string");
    expect(result.table).toBeDefined();
    expect(result.table!.numRows).toBeGreaterThan(0);
  });

  it("reports subscription errors through onError callback", async () => {
    const client = createMockClient();

    const error = await new Promise<Error>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for subscribe error"));
      }, 1000);

      const unsubscribe = client.subscribe(
        "items.fail()",
        () => undefined,
        (err) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(err);
        },
      );
    });

    expect(error.message).toContain("Subscription failed");
  });
});
