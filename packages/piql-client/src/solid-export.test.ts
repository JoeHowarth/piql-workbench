import { describe, expect, it } from "bun:test";

describe("piql-client solid exports", () => {
  it("exports PiqlProvider and usePiqlClient from piql-client/solid", async () => {
    const mod = await import("piql-client/solid");
    expect(mod.PiqlProvider).toBeDefined();
    expect(mod.usePiqlClient).toBeDefined();
  });
});
