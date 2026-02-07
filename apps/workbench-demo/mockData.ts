import { type Table, tableFromArrays } from "apache-arrow";

const ITEM_NAMES = [
  "Widget",
  "Gadget",
  "Gizmo",
  "Doohickey",
  "Thingamajig",
  "Whatchamacallit",
  "Contraption",
  "Device",
  "Apparatus",
  "Mechanism",
];

const STATUSES = ["In Stock", "Low Stock", "Out of Stock", "Discontinued"];
const BASE_TIME_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function createMockTable(rowCount: number = 100, seed = 0): Table {
  const ids = Int32Array.from({ length: rowCount }, (_, i) => i + 1);
  const names = Array.from(
    { length: rowCount },
    (_, i) =>
      `${ITEM_NAMES[i % ITEM_NAMES.length]} ${Math.floor(i / ITEM_NAMES.length) + 1}`,
  );
  const prices = Float64Array.from({ length: rowCount }, (_, i) =>
    Number(((((seed + (i + 1) * 97) % 99_900) + 100) / 100).toFixed(2)),
  );
  const quantities = Int32Array.from(
    { length: rowCount },
    (_, i) => (seed + (i + 1) * 37) % 500,
  );
  const inStock = Array.from(
    { length: rowCount },
    (_, i) => (seed + i + 1) % 5 !== 0,
  );
  const statuses = Array.from(
    { length: rowCount },
    (_, i) => STATUSES[(seed + i) % STATUSES.length],
  );
  const updatedAt = Array.from({ length: rowCount }, (_, i) => {
    const offset = (seed * 131 + (i + 1) * 12_345) % ONE_WEEK_MS;
    return new Date(BASE_TIME_MS - offset);
  });

  return tableFromArrays({
    id: ids,
    name: names,
    price: prices,
    quantity: quantities,
    in_stock: inStock,
    status: statuses,
    updated_at: updatedAt,
  });
}
