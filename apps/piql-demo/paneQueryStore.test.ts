import { describe, expect, it } from "bun:test";
import { createPaneQueryStore } from "./paneQueryStore";

describe("createPaneQueryStore", () => {
  it("initializes and updates pane-scoped state", () => {
    const store = createPaneQueryStore();
    const paneId = "pane-1";

    expect(store.getState(paneId)).toEqual({
      queryText: "",
      table: null,
      error: null,
      loading: false,
    });

    store.setQuery(paneId, "orders.head(5)");
    expect(store.getState(paneId).queryText).toBe("orders.head(5)");

    store.setLoading(paneId, true);
    expect(store.getState(paneId).loading).toBe(true);

    store.setResult(paneId, null, new Error("boom"));
    expect(store.getState(paneId).loading).toBe(false);
    expect(store.getState(paneId).error?.message).toBe("boom");
  });

  it("clears a specific pane", () => {
    const store = createPaneQueryStore();
    const paneId = "pane-2";

    store.setQuery(paneId, "items.head(2)");
    expect(store.getState(paneId).queryText).toBe("items.head(2)");

    store.clear(paneId);
    expect(store.getState(paneId).queryText).toBe("");
  });
});
