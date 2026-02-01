import { type Table, tableFromIPC } from "apache-arrow";
import type { ColumnSchema, ParsedArrowData } from "./types";

/**
 * Parse an Arrow Table into schema + rows for rendering
 */
export function parseArrowTable(table: Table): ParsedArrowData {
  const schema: ColumnSchema[] = table.schema.fields.map((field) => ({
    name: field.name,
    type: field.type.toString(),
    nullable: field.nullable,
  }));

  // Convert to row-major format for easier rendering
  // Arrow stores data column-major, but tables render row-major
  const rows: Record<string, unknown>[] = [];
  for (const row of table) {
    rows.push(row.toJSON());
  }

  return { schema, rows };
}

/**
 * Parse an Arrow IPC buffer into schema + rows for rendering
 * @deprecated Use parseArrowTable with a Table directly
 */
export function parseArrowBuffer(buffer: ArrayBuffer): ParsedArrowData {
  const table = tableFromIPC(buffer);
  return parseArrowTable(table);
}

// Utility to check if a type is numeric for alignment/formatting
export function isNumericType(type: string): boolean {
  return (
    type.startsWith("Int") ||
    type.startsWith("Uint") ||
    type.startsWith("Float") ||
    type === "Decimal"
  );
}

// Utility to check if a type is a timestamp/date
export function isTemporalType(type: string): boolean {
  return (
    type.startsWith("Timestamp") ||
    type.startsWith("Date") ||
    type.startsWith("Time")
  );
}

// Utility to check if a type is boolean
export function isBooleanType(type: string): boolean {
  return type === "Bool";
}
