import type { Component } from "solid-js";
import { For } from "solid-js";
import type { ColumnConfig, ColumnSchema } from "../lib/types";
import { TableCell } from "./TableCell";

interface Props {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  columnWidths: Record<string, number>;
  columnConfig?: Record<string, ColumnConfig>;
  striped?: boolean;
  compact?: boolean;
}

export const TableBody: Component<Props> = (props) => {
  const isStriped = () => props.striped ?? true;

  return (
    <tbody>
      <For each={props.rows}>
        {(row, rowIndex) => (
          <tr
            class="hover:bg-blue-50 dark:hover:bg-blue-900/30"
            classList={{
              "bg-gray-50 dark:bg-gray-800/50":
                isStriped() && rowIndex() % 2 === 1,
            }}
          >
            <For each={props.columns}>
              {(col) => (
                <TableCell
                  value={row[col.name]}
                  type={col.type}
                  width={props.columnWidths[col.name] ?? 150}
                  config={props.columnConfig?.[col.name]}
                  compact={props.compact}
                />
              )}
            </For>
          </tr>
        )}
      </For>
    </tbody>
  );
};
