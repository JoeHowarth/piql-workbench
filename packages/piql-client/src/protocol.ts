// Protocol types matching the Rust server

/** Messages from client to server */
export type ClientMessage =
  | { type: "list_dfs" }
  | { type: "subscribe"; name: string; query: string }
  | { type: "unsubscribe"; name: string }
  | { type: "query"; query: string };

/** Messages from server to client */
export type ServerMessage =
  | { type: "dfs"; names: string[] }
  | { type: "subscribed"; name: string }
  | { type: "unsubscribed"; name: string }
  | { type: "error"; message: string }
  | { type: "result_header"; name: string; tick: number; size: number }
  | { type: "query_result_header"; size: number };
