import { createContext, useContext, createSignal } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { PaneNode, TileSpec, DropPosition, WorkbenchContextValue } from './types';
import { insertTile, removePane, movePane, updateSizes } from './utils/tree';

const WorkbenchContext = createContext<WorkbenchContextValue>();

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return ctx;
}

export function createWorkbenchContext(
  initialSpecs: TileSpec[],
  initialLayout: PaneNode
): {
  Provider: typeof WorkbenchContext.Provider;
  value: WorkbenchContextValue;
} {
  const [layout, setLayout] = createSignal<PaneNode | null>(initialLayout);
  const [specs] = createSignal<TileSpec[]>(initialSpecs);

  // Store sizes separately to avoid tree re-renders on resize
  // Key: splitId, Value: sizes array
  const [sizesOverride, setSizesOverride] = createSignal<Map<string, number[]>>(new Map());

  const getSpec = (id: string): TileSpec | undefined => {
    return specs().find((s) => s.id === id);
  };

  const addTile = (specId: string, targetPaneId: string, position: DropPosition) => {
    const current = applyOverridesToTree();
    if (!current) return;
    setSizesOverride(new Map()); // Clear overrides
    setLayout(insertTile(current, targetPaneId, position, specId));
  };

  const removePaneAction = (paneId: string) => {
    const current = applyOverridesToTree();
    if (!current) return;
    setSizesOverride(new Map()); // Clear overrides
    setLayout(removePane(current, paneId));
  };

  const movePaneAction = (sourcePaneId: string, targetPaneId: string, position: DropPosition) => {
    const current = applyOverridesToTree();
    if (!current) return;
    setSizesOverride(new Map()); // Clear overrides
    setLayout(movePane(current, sourcePaneId, targetPaneId, position));
  };

  // Get sizes for a split, checking override first
  const getSizes = (splitId: string, defaultSizes: number[]): number[] => {
    const override = sizesOverride().get(splitId);
    return override ?? defaultSizes;
  };

  const updateSizesAction = (splitId: string, newSizes: number[]) => {
    // Store in override map instead of updating tree (avoids re-render)
    setSizesOverride((prev) => {
      const next = new Map(prev);
      next.set(splitId, newSizes);
      return next;
    });
  };

  // Apply size overrides to tree before structure changes
  const applyOverridesToTree = (): PaneNode | null => {
    let current = layout();
    if (!current) return null;
    const overrides = sizesOverride();
    for (const [splitId, sizes] of overrides) {
      current = updateSizes(current, splitId, sizes);
    }
    return current;
  };

  const value: WorkbenchContextValue = {
    layout,
    specs,
    getSpec,
    getSizes,
    addTile,
    removePane: removePaneAction,
    movePane: movePaneAction,
    updateSizes: updateSizesAction,
  };

  return {
    Provider: WorkbenchContext.Provider,
    value,
  };
}

// Re-export for internal use
export { WorkbenchContext };
