import type { Table } from "apache-arrow";
import { DataFrameTable } from "query-viz";
import type { Component } from "solid-js";
import { createSignal, onCleanup } from "solid-js";
import type { TileSpec } from "workbench";
import { createMockTable } from "../mockData";

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
  const [table, setTable] = createSignal<Table | null>(
    createMockTable(props.rowCount, 0),
  );

  // Simulate live updates
  let tick = 0;
  const intervalId = window.setInterval(() => {
    tick += 1;
    setTable(createMockTable(props.rowCount, tick));
  }, 3000);

  onCleanup(() => clearInterval(intervalId));

  return (
    <DataFrameTable
      table={table}
      config={{
        columns: {
          id: { label: "ID", width: 60 },
          name: { label: "Product", width: 150 },
          price: { label: "Price", width: 80 },
          quantity: { label: "Qty", width: 60 },
          status: {
            label: "Status",
            width: 100,
            statusColors: {
              "In Stock": "green",
              "Low Stock": "yellow",
              "Out of Stock": "red",
              Discontinued: "gray",
            },
          },
        },
        stripedRows: true,
        density: "compact",
      }}
      class="h-full"
    />
  );
};
