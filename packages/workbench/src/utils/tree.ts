import type { PaneNode, LeafPane, SplitPane, DropPosition } from '../types';
import { generatePaneId } from './ids';

// Find a pane by id
export function findPane(tree: PaneNode, id: string): PaneNode | null {
  if (tree.id === id) return tree;
  if (tree.type === 'split') {
    for (const child of tree.children) {
      const found = findPane(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Find parent of a pane
export function findParent(tree: PaneNode, id: string): SplitPane | null {
  if (tree.type === 'leaf') return null;
  for (const child of tree.children) {
    if (child.id === id) return tree;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

// Get split direction for a drop position
function getSplitDir(position: DropPosition): 'h' | 'v' {
  return position === 'left' || position === 'right' ? 'h' : 'v';
}

// Get whether new pane goes first or second
function isFirstPosition(position: DropPosition): boolean {
  return position === 'left' || position === 'top';
}

// Insert a new tile, splitting the target pane
export function insertTile(
  tree: PaneNode,
  targetId: string,
  position: DropPosition,
  newSpecId: string
): PaneNode {
  const newLeaf: LeafPane = {
    type: 'leaf',
    id: generatePaneId(),
    specId: newSpecId,
  };

  // If dropping on center, replace the target pane's specId
  if (position === 'center') {
    return replaceInTree(tree, targetId, (node) => {
      if (node.type !== 'leaf') return node;
      return { ...node, specId: newSpecId };
    });
  }

  // Otherwise, split the target pane
  return replaceInTree(tree, targetId, (target) => {
    const dir = getSplitDir(position);
    const first = isFirstPosition(position);
    const children = first ? [newLeaf, target] : [target, newLeaf];

    return {
      type: 'split',
      id: generatePaneId(),
      dir,
      children,
      sizes: [50, 50],
    } as SplitPane;
  });
}

// Remove a pane from the tree
export function removePane(tree: PaneNode, paneId: string): PaneNode | null {
  // If removing the root, return null
  if (tree.id === paneId) return null;

  return removeFromTree(tree, paneId);
}

// Move a pane from one location to another
export function movePane(
  tree: PaneNode,
  sourceId: string,
  targetId: string,
  position: DropPosition
): PaneNode {
  // Don't move to self
  if (sourceId === targetId) return tree;

  // Find the source pane
  const source = findPane(tree, sourceId);
  if (!source || source.type !== 'leaf') return tree;

  // Get the specId before removing
  const specId = source.specId;

  // Remove source from tree
  const treeWithoutSource = removePane(tree, sourceId);
  if (!treeWithoutSource) {
    // Source was the only pane
    return tree;
  }

  // Verify target still exists after removal
  const targetStillExists = findPane(treeWithoutSource, targetId);
  if (!targetStillExists) {
    // Target was affected by removal (e.g., was a sibling that got promoted)
    // In this case, just return the tree without the source
    return treeWithoutSource;
  }

  // Insert at target location
  return insertTile(treeWithoutSource, targetId, position, specId);
}

// Helper: replace a node in the tree
function replaceInTree(
  tree: PaneNode,
  id: string,
  replacer: (node: PaneNode) => PaneNode
): PaneNode {
  if (tree.id === id) {
    return replacer(tree);
  }

  if (tree.type === 'split') {
    return {
      ...tree,
      children: tree.children.map((child) => replaceInTree(child, id, replacer)),
    };
  }

  return tree;
}

// Helper: remove a node and collapse empty splits
function removeFromTree(tree: PaneNode, id: string): PaneNode | null {
  if (tree.type === 'leaf') {
    return tree.id === id ? null : tree;
  }

  // Filter out the removed child
  const newChildren: PaneNode[] = [];
  const newSizes: number[] = [];
  let removedIndex = -1;

  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i];
    if (child.id === id) {
      removedIndex = i;
      continue;
    }
    const processed = removeFromTree(child, id);
    if (processed) {
      newChildren.push(processed);
      newSizes.push(tree.sizes[i]);
    } else {
      removedIndex = i;
    }
  }

  // If no children left, this split should be removed
  if (newChildren.length === 0) return null;

  // If only one child left, collapse the split
  if (newChildren.length === 1) return newChildren[0];

  // Normalize sizes to sum to 100
  const sizeSum = newSizes.reduce((a, b) => a + b, 0);
  const normalizedSizes = newSizes.map((s) => (s / sizeSum) * 100);

  return {
    ...tree,
    children: newChildren,
    sizes: normalizedSizes,
  };
}

// Update sizes for a split pane
export function updateSizes(
  tree: PaneNode,
  splitId: string,
  newSizes: number[]
): PaneNode {
  return replaceInTree(tree, splitId, (node) => {
    if (node.type !== 'split') return node;
    return { ...node, sizes: newSizes };
  });
}
