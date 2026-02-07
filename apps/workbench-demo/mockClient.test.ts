import { describe, expect, it } from "bun:test";
import { workbenchMockClient } from "./MockPiqlProvider";

describe("workbenchMockClient", () => {
  it("implements full PiqlClient method surface", () => {
    expect(typeof workbenchMockClient.listDataframes).toBe("function");
    expect(typeof workbenchMockClient.query).toBe("function");
    expect(typeof workbenchMockClient.ask).toBe("function");
    expect(typeof workbenchMockClient.subscribe).toBe("function");
  });

  it("lists dataframes and executes query", async () => {
    const names = await workbenchMockClient.listDataframes();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);

    const table = await workbenchMockClient.query("orders.head(3)");
    expect(table.numRows).toBe(3);
  });

  it("returns deterministic results for repeated identical queries", async () => {
    const first = await workbenchMockClient.query("orders.head(6)");
    const second = await workbenchMockClient.query("orders.head(6)");

    const firstRows = first.toArray().map((row) => row.toJSON());
    const secondRows = second.toArray().map((row) => row.toJSON());
    expect(secondRows).toEqual(firstRows);
  });

  it("supports ask execute=false and execute=true", async () => {
    const noExec = await workbenchMockClient.ask("show top 5 inventory", false);
    expect(typeof noExec.query).toBe("string");
    expect(noExec.table).toBeUndefined();

    const withExec = await workbenchMockClient.ask(
      "show top 5 inventory",
      true,
    );
    expect(typeof withExec.query).toBe("string");
    expect(withExec.table).toBeDefined();
    expect(withExec.table!.numRows).toBe(5);
  });

  it("reports subscription errors through onError callback", async () => {
    const error = await new Promise<Error>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out waiting for subscribe error"));
      }, 1000);

      const unsubscribe = workbenchMockClient.subscribe(
        "orders.fail()",
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
