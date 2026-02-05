import { describe, expect, it, beforeEach, mock } from "bun:test";
import {
  getQueryState,
  setQueryText,
  setQueryLoading,
  setQueryResult,
  clearQueryState,
} from "./queryStore";

// Mock client for testing execute behavior
const mockQuery = mock(() => Promise.resolve({ numRows: 0 } as any));

/**
 * Test the handleTileAdded logic in isolation.
 * This mirrors the handler in App.tsx.
 */
function handleTileAdded(
  paneId: string,
  specId: string,
  initialData?: unknown,
) {
  if (specId === "query" && initialData && typeof initialData === "object") {
    const data = initialData as { query?: string; execute?: boolean };
    if (data.query) {
      setQueryText(paneId, data.query);

      if (data.execute) {
        setQueryLoading(paneId, true);
        mockQuery(data.query)
          .then((table) => setQueryResult(paneId, table, null))
          .catch((e) =>
            setQueryResult(paneId, null, e instanceof Error ? e : new Error(String(e)))
          );
      }
    }
  }
}

describe("handleTileAdded", () => {
  beforeEach(() => {
    // Clean up any test state
    clearQueryState("test-pane-1");
    clearQueryState("test-pane-2");
    clearQueryState("test-pane-3");
  });

  it("sets query text for query tiles with initialData", () => {
    handleTileAdded("test-pane-1", "query", { query: "orders.head(10)" });

    expect(getQueryState("test-pane-1").queryText).toBe("orders.head(10)");
  });

  it("ignores non-query tiles", () => {
    handleTileAdded("test-pane-2", "chart", { query: "should-be-ignored" });

    // Should have default empty state
    expect(getQueryState("test-pane-2").queryText).toBe("");
  });

  it("ignores query tiles without initialData", () => {
    handleTileAdded("test-pane-3", "query", undefined);

    expect(getQueryState("test-pane-3").queryText).toBe("");
  });

  it("ignores query tiles with initialData missing query field", () => {
    handleTileAdded("test-pane-1", "query", { other: "value" });

    expect(getQueryState("test-pane-1").queryText).toBe("");
  });

  it("ignores query tiles with non-object initialData", () => {
    handleTileAdded("test-pane-1", "query", "not-an-object");

    expect(getQueryState("test-pane-1").queryText).toBe("");
  });

  it("sets loading and calls query when execute is true", () => {
    mockQuery.mockClear();

    handleTileAdded("test-pane-1", "query", {
      query: "orders.head(10)",
      execute: true,
    });

    expect(getQueryState("test-pane-1").queryText).toBe("orders.head(10)");
    expect(getQueryState("test-pane-1").loading).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith("orders.head(10)");
  });

  it("does not call query when execute is false", () => {
    mockQuery.mockClear();

    handleTileAdded("test-pane-1", "query", {
      query: "orders.head(10)",
      execute: false,
    });

    expect(getQueryState("test-pane-1").queryText).toBe("orders.head(10)");
    expect(getQueryState("test-pane-1").loading).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
