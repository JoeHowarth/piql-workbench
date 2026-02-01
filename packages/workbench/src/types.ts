import type { Accessor, JSX } from 'solid-js';

// Layout tree nodes
export type LeafPane = {
  type: 'leaf';
  id: string;
  specId: string;
};

// Size can be percentage (number) or pixels ({ px: number })
export type SizeSpec = number | { px: number };

export type SplitPane = {
  type: 'split';
  id: string;
  dir: 'h' | 'v';
  children: PaneNode[];
  sizes: SizeSpec[]; // percentages or pixel specs
};

export type PaneNode = LeafPane | SplitPane;

// Tile definition (created by app factories)
export interface TileSpec {
  id: string;
  title: string;
  component: () => JSX.Element;
  closable?: boolean; // default true
}

// Drop positions for drag/drop
export type DropPosition = 'left' | 'right' | 'top' | 'bottom' | 'center';

// Workbench context interface
export interface WorkbenchContextValue {
  // Layout state (read-only)
  layout: Accessor<PaneNode | null>;

  // Tile registry (read-only)
  specs: Accessor<TileSpec[]>;
  getSpec: (id: string) => TileSpec | undefined;

  // Size overrides (for reading current sizes without triggering re-renders)
  getSizes: (splitId: string, defaultSizes: SizeSpec[]) => SizeSpec[];

  // Layout mutations
  addTile: (specId: string, targetPaneId: string, position: DropPosition) => void;
  removePane: (paneId: string) => void;
  movePane: (sourcePaneId: string, targetPaneId: string, position: DropPosition) => void;
  updateSizes: (splitId: string, sizes: number[]) => void;
}

// Props for the main Workbench component
export interface WorkbenchProps {
  specs: TileSpec[];
  initialLayout: PaneNode;
  class?: string;
}
