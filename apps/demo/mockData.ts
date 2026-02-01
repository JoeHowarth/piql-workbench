import { tableFromArrays, tableToIPC } from "apache-arrow";

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

export function createMockArrowBuffer(rowCount: number = 100): ArrayBuffer {
  const ids = Int32Array.from({ length: rowCount }, (_, i) => i + 1);
  const names = Array.from(
    { length: rowCount },
    (_, i) =>
      `${ITEM_NAMES[i % ITEM_NAMES.length]} ${Math.floor(i / ITEM_NAMES.length) + 1}`,
  );
  const prices = Float64Array.from(
    { length: rowCount },
    () => Math.round(Math.random() * 99900 + 100) / 100, // $1.00 - $999.99
  );
  const quantities = Int32Array.from({ length: rowCount }, () =>
    Math.floor(Math.random() * 500),
  );
  const inStock = Array.from({ length: rowCount }, () => Math.random() > 0.2);
  const statuses = Array.from(
    { length: rowCount },
    () => STATUSES[Math.floor(Math.random() * STATUSES.length)],
  );
  const updatedAt = Array.from(
    { length: rowCount },
    () =>
      new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ),
  );

  const table = tableFromArrays({
    id: ids,
    name: names,
    price: prices,
    quantity: quantities,
    in_stock: inStock,
    status: statuses,
    updated_at: updatedAt,
  });

  const ipcBuffer = tableToIPC(table);
  // tableToIPC returns a Uint8Array, copy to a fresh ArrayBuffer
  const buffer = new ArrayBuffer(ipcBuffer.byteLength);
  new Uint8Array(buffer).set(ipcBuffer);
  return buffer;
}

// Create a buffer with some data changes for simulating live updates
export function createUpdatedMockArrowBuffer(
  baseRowCount: number = 100,
): ArrayBuffer {
  return createMockArrowBuffer(baseRowCount);
}
