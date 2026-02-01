import { Workbench } from 'workbench';
import type { PaneNode, TileSpec } from 'workbench';
import { pickerTile } from './tiles/PickerTile';
import { timeControlsTile } from './tiles/TimeControlsTile';
import { tableTile } from './tiles/TableTile';

const specs: TileSpec[] = [
  pickerTile(),
  timeControlsTile(),
  tableTile('orders', { label: 'Orders', rowCount: 100 }),
  tableTile('inventory', { label: 'Inventory', rowCount: 75 }),
  tableTile('shipments', { label: 'Shipments', rowCount: 50 }),
];

const initialLayout: PaneNode = {
  type: 'split',
  id: 'root',
  dir: 'h',
  sizes: [20, 80],
  children: [
    { type: 'leaf', id: 'picker-pane', specId: 'picker' },
    {
      type: 'split',
      id: 'main-split',
      dir: 'v',
      sizes: [15, 85],
      children: [
        { type: 'leaf', id: 'time-pane', specId: 'time-controls' },
        { type: 'leaf', id: 'content-pane', specId: 'orders' },
      ],
    },
  ],
};

export default function App() {
  return (
    <div class="h-screen bg-gray-100 p-2">
      <Workbench specs={specs} initialLayout={initialLayout} class="h-full" />
    </div>
  );
}
