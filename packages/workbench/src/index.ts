// Main component
export { Workbench } from './Workbench';

// Types
export type {
  PaneNode,
  LeafPane,
  SplitPane,
  TileSpec,
  DropPosition,
  WorkbenchContextValue,
  WorkbenchProps,
} from './types';

// Context hook for tiles that need to interact with workbench
export { useWorkbench } from './context';

// DnD primitives for building picker tiles
export { DraggableItem } from './dnd/DraggableItem';
