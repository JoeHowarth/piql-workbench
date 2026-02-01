import { describe, it, expect, beforeEach } from "bun:test";
import type { LeafPane, PaneNode, SizeSpec, SplitPane } from "../types";
import {
  findPane,
  findParent,
  insertTile,
  removePane,
  movePane,
  updateSizes,
} from "./tree";

// ============================================================================
// Helper: Tree Builder DSL
// ============================================================================

function leaf(id: string, specId: string): LeafPane {
  return { type: "leaf", id, specId };
}

function split(
  id: string,
  dir: "h" | "v",
  sizes: SizeSpec[],
  children: PaneNode[]
): SplitPane {
  return { type: "split", id, dir, sizes, children };
}

// ============================================================================
// Helper: Invariant Checker
// ============================================================================

function assertTreeInvariants(tree: PaneNode | null): void {
  if (tree === null) return;

  if (tree.type === "split") {
    // INV-1: Every split has ≥2 children
    expect(tree.children.length).toBeGreaterThanOrEqual(2);

    // INV-2: sizes.length === children.length
    expect(tree.sizes.length).toBe(tree.children.length);

    // INV-3: Percentage sizes sum to ~100
    const percentages = tree.sizes.filter(
      (s): s is number => typeof s === "number"
    );
    if (percentages.length > 0) {
      const sum = percentages.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(100, 1);
    }

    // Recurse into children
    for (const child of tree.children) {
      assertTreeInvariants(child);
    }
  }

  // INV-5: All IDs unique (collected at top level)
  const ids = collectIds(tree);
  const uniqueIds = new Set(ids);
  expect(ids.length).toBe(uniqueIds.size);
}

function collectIds(tree: PaneNode): string[] {
  if (tree.type === "leaf") return [tree.id];
  return [tree.id, ...tree.children.flatMap(collectIds)];
}

// ============================================================================
// findPane
// ============================================================================

describe("findPane", () => {
  it("finds root leaf", () => {
    const tree = leaf("root", "spec-a");
    expect(findPane(tree, "root")).toBe(tree);
  });

  it("finds root split", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    expect(findPane(tree, "root")).toBe(tree);
  });

  it("finds nested leaf", () => {
    const target = leaf("deep", "spec-deep");
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [leaf("a", "spec-a"), target]),
      leaf("b", "spec-b"),
    ]);
    expect(findPane(tree, "deep")).toBe(target);
  });

  it("returns null for non-existent id", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    expect(findPane(tree, "nonexistent")).toBeNull();
  });
});

// ============================================================================
// findParent
// ============================================================================

describe("findParent", () => {
  it("returns null for root", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    expect(findParent(tree, "root")).toBeNull();
  });

  it("finds parent of direct child", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    expect(findParent(tree, "a")).toBe(tree);
    expect(findParent(tree, "b")).toBe(tree);
  });

  it("finds parent of deeply nested node", () => {
    const innerSplit = split("inner", "v", [50, 50], [
      leaf("deep1", "spec-1"),
      leaf("deep2", "spec-2"),
    ]);
    const tree = split("root", "h", [50, 50], [innerSplit, leaf("b", "spec-b")]);

    expect(findParent(tree, "deep1")).toBe(innerSplit);
    expect(findParent(tree, "deep2")).toBe(innerSplit);
    expect(findParent(tree, "inner")).toBe(tree);
  });

  it("returns null for non-existent id", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    expect(findParent(tree, "nonexistent")).toBeNull();
  });
});

// ============================================================================
// insertTile - Center Drop
// ============================================================================

describe("insertTile - center drop", () => {
  it("replaces specId on center drop", () => {
    const tree = leaf("target", "old-spec");
    const result = insertTile(tree, "target", "center", "new-spec");

    expect(result.type).toBe("leaf");
    expect((result as LeafPane).specId).toBe("new-spec");
    expect(result.id).toBe("target"); // ID unchanged
    assertTreeInvariants(result);
  });

  it("replaces specId in nested leaf", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    const result = insertTile(tree, "a", "center", "new-spec");

    const found = findPane(result, "a") as LeafPane;
    expect(found.specId).toBe("new-spec");
    assertTreeInvariants(result);
  });

  it("does not change structure on center drop", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    const result = insertTile(tree, "a", "center", "new-spec");

    expect(result.type).toBe("split");
    expect((result as SplitPane).children.length).toBe(2);
    assertTreeInvariants(result);
  });
});

// ============================================================================
// insertTile - Edge Drops
// ============================================================================

describe("insertTile - edge drops", () => {
  it("left drop creates horizontal split with new pane first", () => {
    const tree = leaf("target", "existing");
    const result = insertTile(tree, "target", "left", "new-spec");

    expect(result.type).toBe("split");
    const splitResult = result as SplitPane;
    expect(splitResult.dir).toBe("h");
    expect(splitResult.children[0].type).toBe("leaf");
    expect((splitResult.children[0] as LeafPane).specId).toBe("new-spec");
    expect(splitResult.children[1].id).toBe("target");
    expect(splitResult.sizes).toEqual([50, 50]);
    assertTreeInvariants(result);
  });

  it("right drop creates horizontal split with new pane second", () => {
    const tree = leaf("target", "existing");
    const result = insertTile(tree, "target", "right", "new-spec");

    expect(result.type).toBe("split");
    const splitResult = result as SplitPane;
    expect(splitResult.dir).toBe("h");
    expect(splitResult.children[0].id).toBe("target");
    expect((splitResult.children[1] as LeafPane).specId).toBe("new-spec");
    expect(splitResult.sizes).toEqual([50, 50]);
    assertTreeInvariants(result);
  });

  it("top drop creates vertical split with new pane first", () => {
    const tree = leaf("target", "existing");
    const result = insertTile(tree, "target", "top", "new-spec");

    expect(result.type).toBe("split");
    const splitResult = result as SplitPane;
    expect(splitResult.dir).toBe("v");
    expect((splitResult.children[0] as LeafPane).specId).toBe("new-spec");
    expect(splitResult.children[1].id).toBe("target");
    assertTreeInvariants(result);
  });

  it("bottom drop creates vertical split with new pane second", () => {
    const tree = leaf("target", "existing");
    const result = insertTile(tree, "target", "bottom", "new-spec");

    expect(result.type).toBe("split");
    const splitResult = result as SplitPane;
    expect(splitResult.dir).toBe("v");
    expect(splitResult.children[0].id).toBe("target");
    expect((splitResult.children[1] as LeafPane).specId).toBe("new-spec");
    assertTreeInvariants(result);
  });

  it("preserves original target pane in tree", () => {
    const tree = leaf("target", "existing");
    const result = insertTile(tree, "target", "left", "new-spec");

    const found = findPane(result, "target");
    expect(found).not.toBeNull();
    expect((found as LeafPane).specId).toBe("existing");
  });

  it("inserts into deeply nested pane", () => {
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [
        leaf("deep", "spec-deep"),
        leaf("other", "spec-other"),
      ]),
      leaf("right", "spec-right"),
    ]);

    const result = insertTile(tree, "deep", "right", "new-spec");

    // The deep leaf should now be in a split with the new pane
    const deepPane = findPane(result, "deep");
    expect(deepPane).not.toBeNull();

    const deepParent = findParent(result, "deep");
    expect(deepParent).not.toBeNull();
    expect(deepParent!.dir).toBe("h"); // right drop = horizontal
    assertTreeInvariants(result);
  });
});

// ============================================================================
// removePane - Basic
// ============================================================================

describe("removePane - basic", () => {
  it("returns null when removing root leaf", () => {
    const tree = leaf("root", "spec");
    const result = removePane(tree, "root");
    expect(result).toBeNull();
  });

  it("returns null when removing root split", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    const result = removePane(tree, "root");
    expect(result).toBeNull();
  });

  it("collapses 2-child split when removing one child", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);
    const result = removePane(tree, "a");

    // Should collapse to remaining child
    expect(result).not.toBeNull();
    expect(result!.type).toBe("leaf");
    expect(result!.id).toBe("b");
  });

  it("removes child from 3+ child split without collapse", () => {
    const tree = split("root", "h", [30, 30, 40], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
      leaf("c", "spec-c"),
    ]);
    const result = removePane(tree, "b");

    expect(result).not.toBeNull();
    expect(result!.type).toBe("split");
    const splitResult = result as SplitPane;
    expect(splitResult.children.length).toBe(2);
    expect(findPane(result!, "a")).not.toBeNull();
    expect(findPane(result!, "c")).not.toBeNull();
    expect(findPane(result!, "b")).toBeNull();
    assertTreeInvariants(result);
  });
});

// ============================================================================
// removePane - Cascade Collapse
// ============================================================================

describe("removePane - cascade collapse", () => {
  it("collapses parent when it becomes single-child", () => {
    // root (h) -> [left (v) -> [a, b], right]
    // Remove 'a' -> left collapses to 'b' -> root has [b, right]
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [leaf("a", "spec-a"), leaf("b", "spec-b")]),
      leaf("right", "spec-right"),
    ]);

    const result = removePane(tree, "a");

    expect(result).not.toBeNull();
    expect(result!.type).toBe("split");
    const rootSplit = result as SplitPane;

    // The left split should have collapsed, 'b' promoted
    expect(rootSplit.children[0].id).toBe("b");
    expect(rootSplit.children[1].id).toBe("right");
    assertTreeInvariants(result);
  });

  it("handles deep cascade collapse", () => {
    // root -> left -> inner -> [a, b]
    //      -> right
    // Remove 'a' -> inner collapses -> left collapses -> root has [b, right]
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [
        split("inner", "h", [50, 50], [
          leaf("a", "spec-a"),
          leaf("b", "spec-b"),
        ]),
        leaf("c", "spec-c"),
      ]),
      leaf("right", "spec-right"),
    ]);

    const result = removePane(tree, "a");

    expect(result).not.toBeNull();
    // 'b' should have been promoted to replace inner
    expect(findPane(result!, "b")).not.toBeNull();
    expect(findPane(result!, "a")).toBeNull();
    assertTreeInvariants(result);
  });
});

// ============================================================================
// removePane - Size Normalization
// ============================================================================

describe("removePane - size normalization", () => {
  it("normalizes remaining percentages to sum to 100", () => {
    const tree = split("root", "h", [30, 30, 40], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
      leaf("c", "spec-c"),
    ]);

    const result = removePane(tree, "b");

    expect(result).not.toBeNull();
    const splitResult = result as SplitPane;
    const sum = (splitResult.sizes as number[]).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 1);
    assertTreeInvariants(result);
  });

  it("preserves pixel sizes during normalization", () => {
    const tree = split("root", "h", [{ px: 100 }, 50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
      leaf("c", "spec-c"),
    ]);

    const result = removePane(tree, "b");

    expect(result).not.toBeNull();
    const splitResult = result as SplitPane;

    // Pixel size should be unchanged
    expect(splitResult.sizes[0]).toEqual({ px: 100 });

    // Remaining percentage should be 100
    expect(splitResult.sizes[1]).toBe(100);
    assertTreeInvariants(result);
  });

  it("handles all-pixel sizes (no normalization needed)", () => {
    const tree = split("root", "h", [{ px: 100 }, { px: 200 }, { px: 300 }], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
      leaf("c", "spec-c"),
    ]);

    const result = removePane(tree, "b");

    expect(result).not.toBeNull();
    const splitResult = result as SplitPane;
    expect(splitResult.sizes).toEqual([{ px: 100 }, { px: 300 }]);
    assertTreeInvariants(result);
  });
});

// ============================================================================
// movePane
// ============================================================================

describe("movePane", () => {
  it("returns unchanged tree when moving to self", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = movePane(tree, "a", "a", "right");
    expect(result).toBe(tree); // Same reference
  });

  it("moves pane to sibling", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = movePane(tree, "a", "b", "right");

    // 'a' should be removed from its position and inserted to right of 'b'
    expect(result).not.toBeNull();
    expect(findPane(result, "a")).toBeNull(); // 'a' was removed (tree collapsed)

    // The result should have spec-a somewhere
    const allSpecs = collectSpecIds(result);
    expect(allSpecs).toContain("spec-a");
    expect(allSpecs).toContain("spec-b");
    assertTreeInvariants(result);
  });

  it("moves pane to different branch", () => {
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [leaf("a", "spec-a"), leaf("b", "spec-b")]),
      leaf("right", "spec-right"),
    ]);

    const result = movePane(tree, "a", "right", "bottom");

    // 'a' should now be below 'right'
    const rightParent = findParent(result, "right");
    expect(rightParent).not.toBeNull();
    expect(rightParent!.dir).toBe("v"); // vertical split for bottom drop

    // Both specs should still exist
    const allSpecs = collectSpecIds(result);
    expect(allSpecs).toContain("spec-a");
    expect(allSpecs).toContain("spec-right");
    assertTreeInvariants(result);
  });

  it("handles move that causes source parent collapse", () => {
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [leaf("a", "spec-a"), leaf("b", "spec-b")]),
      leaf("right", "spec-right"),
    ]);

    const result = movePane(tree, "a", "right", "left");

    // Left split should have collapsed since only 'b' remains
    expect(findPane(result, "left")).toBeNull();
    expect(findPane(result, "b")).not.toBeNull();
    assertTreeInvariants(result);
  });

  it("returns tree without source when target disappears", () => {
    // This happens when source and target are siblings in a 2-child split
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    // Moving 'a' causes root to collapse, 'b' becomes root, then 'b' doesn't exist
    // as a target anymore in the same form
    const result = movePane(tree, "a", "b", "right");

    // Should still work - result contains both specs
    const allSpecs = collectSpecIds(result);
    expect(allSpecs).toContain("spec-a");
    expect(allSpecs).toContain("spec-b");
    assertTreeInvariants(result);
  });

  it("returns unchanged tree when trying to move non-leaf", () => {
    const innerSplit = split("inner", "v", [50, 50], [
      leaf("c", "spec-c"),
      leaf("d", "spec-d"),
    ]);
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      innerSplit,
    ]);

    const result = movePane(tree, "inner", "a", "right");
    expect(result).toBe(tree); // Unchanged
  });
});

// ============================================================================
// updateSizes
// ============================================================================

describe("updateSizes", () => {
  it("updates sizes on root split", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = updateSizes(tree, "root", [30, 70]);

    expect((result as SplitPane).sizes).toEqual([30, 70]);
  });

  it("updates sizes on nested split", () => {
    const tree = split("root", "h", [50, 50], [
      split("left", "v", [50, 50], [leaf("a", "spec-a"), leaf("b", "spec-b")]),
      leaf("right", "spec-right"),
    ]);

    const result = updateSizes(tree, "left", [20, 80]);

    const leftSplit = findPane(result, "left") as SplitPane;
    expect(leftSplit.sizes).toEqual([20, 80]);

    // Root sizes unchanged
    expect((result as SplitPane).sizes).toEqual([50, 50]);
  });

  it("returns unchanged tree when id not found", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = updateSizes(tree, "nonexistent", [30, 70]);

    expect((result as SplitPane).sizes).toEqual([50, 50]); // Unchanged
  });

  it("returns unchanged tree when targeting a leaf", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = updateSizes(tree, "a", [30, 70]);

    // Sizes should be unchanged since 'a' is a leaf
    expect((result as SplitPane).sizes).toEqual([50, 50]);
  });

  it("supports pixel sizes", () => {
    const tree = split("root", "h", [50, 50], [
      leaf("a", "spec-a"),
      leaf("b", "spec-b"),
    ]);

    const result = updateSizes(tree, "root", [{ px: 200 }, 100]);

    expect((result as SplitPane).sizes).toEqual([{ px: 200 }, 100]);
  });
});

// ============================================================================
// Helper
// ============================================================================

function collectSpecIds(tree: PaneNode): string[] {
  if (tree.type === "leaf") return [tree.specId];
  return tree.children.flatMap(collectSpecIds);
}
