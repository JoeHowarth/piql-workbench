// Re-export apache-arrow Table type for convenience
export type { Table } from "apache-arrow";
export type { PiqlClientOptions, SubscriptionCallback } from "./client";
export { PiqlClient } from "./client";
export type { ClientMessage, ServerMessage, ResultHeader } from "./protocol";
export { decodeBinaryResult } from "./protocol";
