// Protocol types matching the Rust server

/** Messages from client to server */
export type ClientMessage =
  | { type: "list_dfs" }
  | { type: "subscribe"; name: string; query: string }
  | { type: "unsubscribe"; name: string }
  | { type: "query"; query: string };

/** Messages from server to client (text JSON) */
export type ServerMessage =
  | { type: "dfs"; names: string[] }
  | { type: "subscribed"; name: string }
  | { type: "unsubscribed"; name: string }
  | { type: "error"; message: string }
  | { type: "result_header"; name: string; tick: number; size: number }
  | { type: "query_result_header"; size: number };

/** Result header types (embedded in binary messages) */
export type ResultHeader = Extract<
  ServerMessage,
  { type: "result_header" } | { type: "query_result_header" }
>;

/**
 * Decode a combined binary message into header and Arrow IPC payload.
 * Format: [4-byte header length (big-endian u32)][JSON header][Arrow IPC payload]
 */
export function decodeBinaryResult(
  buffer: ArrayBuffer
): { header: ResultHeader; payload: ArrayBuffer } {
  const view = new DataView(buffer);
  const headerLen = view.getUint32(0, false); // big-endian

  const headerBytes = new Uint8Array(buffer, 4, headerLen);
  const headerJson = new TextDecoder().decode(headerBytes);
  const header = JSON.parse(headerJson) as ResultHeader;

  const payload = buffer.slice(4 + headerLen);

  return { header, payload };
}
