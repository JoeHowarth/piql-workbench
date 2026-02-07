import type { Table } from "apache-arrow";
import type { Accessor, Component } from "solid-js";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useArrowData } from "../hooks/useArrowData";
import { useDerivedRows } from "../hooks/useDerivedRows";
import { useTableState } from "../hooks/useTableState";
import type { TableConfig } from "../lib/types";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";

interface Props {
  table: Accessor<Table | null>;
  config?: TableConfig;
  class?: string;
}

export const DataFrameTable: Component<Props> = (props) => {
  const store = useArrowData(props.table);
  let containerRef: HTMLDivElement | undefined;
  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(600);

  const state = useTableState(() => store.schema, props.config);
  const derivedRows = useDerivedRows(
    () => store.rows,
    state.sortBy,
    state.filters,
  );

  // Filter out hidden columns
  const visibleColumns = createMemo(() => {
    return store.schema.filter(
      (col) => !props.config?.columns?.[col.name]?.hidden,
    );
  });

  const rowHeight = createMemo(() =>
    props.config?.density === "compact" ? 30 : 36,
  );

  const virtualWindow = createMemo(() => {
    const rows = derivedRows();
    const totalRows = rows.length;
    const virtualizationThreshold = 80;

    if (totalRows <= virtualizationThreshold) {
      return {
        rows,
        rowOffset: 0,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const currentRowHeight = rowHeight();
    const overscan = 8;
    const visibleCount = Math.max(
      1,
      Math.ceil(viewportHeight() / currentRowHeight),
    );
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop() / currentRowHeight) - overscan,
    );
    const endIndex = Math.min(
      totalRows,
      startIndex + visibleCount + overscan * 2,
    );

    return {
      rows: rows.slice(startIndex, endIndex),
      rowOffset: startIndex,
      topSpacerHeight: startIndex * currentRowHeight,
      bottomSpacerHeight: Math.max(
        0,
        (totalRows - endIndex) * currentRowHeight,
      ),
    };
  });

  onMount(() => {
    if (!containerRef) return;
    const element = containerRef;

    const updateViewport = () => {
      setViewportHeight(element.clientHeight);
    };

    const handleScroll = () => {
      setScrollTop(element.scrollTop);
    };

    updateViewport();
    handleScroll();
    element.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(element);

    onCleanup(() => {
      element.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    });
  });

  return (
    <div
      ref={containerRef}
      class={`overflow-auto ${props.class ?? ""}`}
      classList={{
        relative: props.config?.stickyHeader,
      }}
    >
      <table class="w-full border-collapse text-sm">
        <TableHeader
          columns={visibleColumns()}
          config={props.config?.columns}
          state={state}
          rows={store.rows}
        />
        <TableBody
          columns={visibleColumns()}
          rows={virtualWindow().rows}
          rowOffset={virtualWindow().rowOffset}
          topSpacerHeight={virtualWindow().topSpacerHeight}
          bottomSpacerHeight={virtualWindow().bottomSpacerHeight}
          columnWidths={state.columnWidths()}
          columnConfig={props.config?.columns}
          striped={props.config?.stripedRows}
          compact={props.config?.density === "compact"}
        />
      </table>
    </div>
  );
};
