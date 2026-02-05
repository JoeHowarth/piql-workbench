import { describe, expect, it, beforeEach } from "bun:test";

// We need to test the store behavior, but the store uses solid-js/store
// which requires a reactive context. Let's test the logic directly.

describe("QueryStore", () => {
  // Since solid-js store is reactive and requires a runtime,
  // we'll test by importing and calling the functions directly

  it("should be importable", async () => {
    const store = await import("./queryStore");
    expect(store.getQueryState).toBeDefined();
    expect(store.setQueryText).toBeDefined();
    expect(store.setQueryResult).toBeDefined();
  });

  it("should return default state for new pane id", async () => {
    const { getQueryState } = await import("./queryStore");
    const state = getQueryState("test-pane-1");

    expect(state.queryText).toBe("");
    expect(state.table).toBe(null);
    expect(state.error).toBe(null);
    expect(state.loading).toBe(false);
  });

  it("should persist query text for a pane id", async () => {
    const { getQueryState, setQueryText } = await import("./queryStore");

    setQueryText("test-pane-2", "my query");
    const state = getQueryState("test-pane-2");

    expect(state.queryText).toBe("my query");
  });

  it("should keep state separate between different pane ids", async () => {
    const { getQueryState, setQueryText } = await import("./queryStore");

    setQueryText("pane-a", "query A");
    setQueryText("pane-b", "query B");

    expect(getQueryState("pane-a").queryText).toBe("query A");
    expect(getQueryState("pane-b").queryText).toBe("query B");
  });

  it("should persist state when pane id stays the same", async () => {
    const { getQueryState, setQueryText, setQueryLoading } = await import("./queryStore");

    const paneId = "persistent-pane";

    // Simulate: user types query
    setQueryText(paneId, "test query");

    // Simulate: user clicks run
    setQueryLoading(paneId, true);

    // State should persist across multiple reads
    expect(getQueryState(paneId).queryText).toBe("test query");
    expect(getQueryState(paneId).loading).toBe(true);

    // Simulate: component remounts (what happens on drag)
    // The pane id is the same, so state should be preserved
    const stateAfterRemount = getQueryState(paneId);
    expect(stateAfterRemount.queryText).toBe("test query");
  });
});
