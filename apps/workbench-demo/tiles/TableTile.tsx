import { createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { DataFrameTable } from 'query-viz';
import type { TileSpec } from 'workbench';
import { createMockArrowBuffer } from '../mockData';

interface TableConfig {
  label: string;
  rowCount?: number;
}

export const tableTile = (id: string, config: TableConfig): TileSpec => ({
  id,
  title: config.label,
  component: () => <TableContent rowCount={config.rowCount ?? 50} />,
});

const TableContent: Component<{ rowCount: number }> = (props) => {
  const [data, setData] = createSignal<ArrayBuffer | null>(
    createMockArrowBuffer(props.rowCount)
  );

  // Simulate live updates
  const intervalId = window.setInterval(() => {
    setData(createMockArrowBuffer(props.rowCount));
  }, 3000);

  onCleanup(() => clearInterval(intervalId));

  return (
    <DataFrameTable
      data={data}
      config={{
        columns: {
          id: { label: 'ID', width: 60 },
          name: { label: 'Product', width: 150 },
          price: { label: 'Price', width: 80 },
          quantity: { label: 'Qty', width: 60 },
          status: {
            label: 'Status',
            width: 100,
            statusColors: {
              'In Stock': 'green',
              'Low Stock': 'yellow',
              'Out of Stock': 'red',
              Discontinued: 'gray',
            },
          },
        },
        stripedRows: true,
        density: 'compact',
      }}
      class="h-full"
    />
  );
};
