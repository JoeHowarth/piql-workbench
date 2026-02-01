import type { Accessor, JSX } from 'solid-js';

// Layout tree nodes
export type LeafPane = {
  type: 'leaf';
  id: string;
  specId: string;
};

export type SplitPane = {
  type: 'split';
  id: string;
  dir: 'h' | 'v';
  children: PaneNode[];
  sizes: number[]; // percentages, should sum to 100
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

  // Layout mutations
  addTile: (specId: string, targetPaneId: string, position: DropPosition) => void;
  removePane: (paneId: string) => void;
  movePane: (sourcePaneId: string, targetPaneId: string, position: DropPosition) => void;
}

// Props for the main Workbench component
export interface WorkbenchProps {
  specs: TileSpec[];
  initialLayout: PaneNode;
  class?: string;
}
