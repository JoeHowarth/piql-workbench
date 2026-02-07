import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import type { ColumnConfig, ColumnSchema } from "../lib/types";
import { TableCell } from "./TableCell";

interface Props {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  columnWidths: Record<string, number>;
  columnConfig?: Record<string, ColumnConfig>;
  striped?: boolean;
  compact?: boolean;
  rowOffset?: number;
  topSpacerHeight?: number;
  bottomSpacerHeight?: number;
}

export const TableBody: Component<Props> = (props) => {
  const isStriped = () => props.striped ?? true;
  const rowOffset = () => props.rowOffset ?? 0;
  const topSpacerHeight = () => Math.max(0, props.topSpacerHeight ?? 0);
  const bottomSpacerHeight = () => Math.max(0, props.bottomSpacerHeight ?? 0);
  const columnCount = () => props.columns.length;

  return (
    <tbody>
      <Show when={topSpacerHeight() > 0}>
        <tr data-virtual-spacer="top">
          <td
            colSpan={columnCount()}
            style={{
              height: `${topSpacerHeight()}px`,
              padding: "0",
              border: "none",
            }}
          />
        </tr>
      </Show>

      <For each={props.rows}>
        {(row, rowIndex) => (
          <tr
            class="hover:bg-blue-50 dark:hover:bg-blue-900/30"
            classList={{
              "bg-gray-50 dark:bg-gray-800/50":
                isStriped() && (rowOffset() + rowIndex()) % 2 === 1,
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

      <Show when={bottomSpacerHeight() > 0}>
        <tr data-virtual-spacer="bottom">
          <td
            colSpan={columnCount()}
            style={{
              height: `${bottomSpacerHeight()}px`,
              padding: "0",
              border: "none",
            }}
          />
        </tr>
      </Show>
    </tbody>
  );
};
