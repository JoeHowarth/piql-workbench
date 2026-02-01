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

  const getSpec = (id: string): TileSpec | undefined => {
    return specs().find((s) => s.id === id);
  };

  const addTile = (specId: string, targetPaneId: string, position: DropPosition) => {
    const current = layout();
    if (!current) return;
    setLayout(insertTile(current, targetPaneId, position, specId));
  };

  const removePaneAction = (paneId: string) => {
    const current = layout();
    if (!current) return;
    setLayout(removePane(current, paneId));
  };

  const movePaneAction = (sourcePaneId: string, targetPaneId: string, position: DropPosition) => {
    const current = layout();
    if (!current) return;
    setLayout(movePane(current, sourcePaneId, targetPaneId, position));
  };

  const updateSizesAction = (splitId: string, newSizes: number[]) => {
    const current = layout();
    if (!current) return;
    setLayout(updateSizes(current, splitId, newSizes));
  };

  const value: WorkbenchContextValue = {
    layout,
    specs,
    getSpec,
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
