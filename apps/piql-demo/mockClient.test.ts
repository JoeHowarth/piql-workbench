import { describe, expect, it } from "bun:test";
import { createMockClient } from "./mockClient";

describe("createMockClient", () => {
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
});
