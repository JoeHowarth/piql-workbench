import { type Table, tableFromIPC } from "apache-arrow";
import type { ClientMessage, ServerMessage } from "./protocol";

export type SubscriptionCallback = (table: Table, tick: number) => void;

export interface PiqlClientOptions {
  /** Called when connection is established */
  onConnect?: () => void;
  /** Called when connection is lost */
  onDisconnect?: () => void;
  /** Called on errors */
  onError?: (error: Error) => void;
}

/**
 * WebSocket client for PiQL server
 *
 * @example
 * ```ts
 * const client = new PiqlClient("ws://localhost:9000");
 * await client.connect();
 *
 * // List available dataframes
 * const dfs = await client.listDfs();
 *
 * // Subscribe to query results
 * client.subscribe("rich", "entities.filter($gold > 100)", (table, tick) => {
 *   console.log(`Tick ${tick}:`, table.numRows, "rows");
 * });
 *
 * // One-off query
 * const result = await client.query("entities.head(10)");
 * ```
 */
export class PiqlClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: PiqlClientOptions;

  // Subscription callbacks
  private subscriptions = new Map<string, SubscriptionCallback>();

  // Pending requests (for request/response pattern)
  private pendingListDfs: ((names: string[]) => void) | null = null;
  private pendingQuery: ((table: Table) => void) | null = null;
  private pendingQueryReject: ((error: Error) => void) | null = null;

  // For handling header + binary message pairs
  private pendingHeader: ServerMessage | null = null;

  constructor(url: string, options: PiqlClientOptions = {}) {
    this.url = url;
    this.options = options;
  }

  /** Connect to the server */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.options.onConnect?.();
        resolve();
      };

      this.ws.onerror = (_event) => {
        const error = new Error("WebSocket error");
        this.options.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.options.onDisconnect?.();
        this.ws = null;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  /** Disconnect from the server */
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  /** Check if connected */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** List available dataframes */
  listDfs(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error("Not connected"));
        return;
      }

      this.pendingListDfs = resolve;
      this.send({ type: "list_dfs" });
    });
  }

  /** Subscribe to a query's results */
  subscribe(name: string, query: string, callback: SubscriptionCallback): void {
    if (!this.connected) {
      throw new Error("Not connected");
    }

    this.subscriptions.set(name, callback);
    this.send({ type: "subscribe", name, query });
  }

  /** Unsubscribe from a query */
  unsubscribe(name: string): void {
    if (!this.connected) {
      return;
    }

    this.subscriptions.delete(name);
    this.send({ type: "unsubscribe", name });
  }

  /** Execute a one-off query */
  query(query: string): Promise<Table> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error("Not connected"));
        return;
      }

      this.pendingQuery = resolve;
      this.pendingQueryReject = reject;
      this.send({ type: "query", query });
    });
  }

  private send(msg: ClientMessage): void {
    this.ws?.send(JSON.stringify(msg));
  }

  private handleMessage(data: unknown): void {
    // Binary message - Arrow IPC data
    if (data instanceof Blob) {
      data.arrayBuffer().then((buffer) => this.handleBinary(buffer));
      return;
    }

    if (data instanceof ArrayBuffer) {
      this.handleBinary(data);
      return;
    }

    // Text message - JSON
    if (typeof data === "string") {
      const msg = JSON.parse(data) as ServerMessage;
      this.handleServerMessage(msg);
    }
  }

  private handleServerMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case "dfs":
        this.pendingListDfs?.(msg.names);
        this.pendingListDfs = null;
        break;

      case "subscribed":
        // Could add a callback for this if needed
        break;

      case "unsubscribed":
        // Could add a callback for this if needed
        break;

      case "error": {
        const error = new Error(msg.message);
        if (this.pendingQueryReject) {
          this.pendingQueryReject(error);
          this.pendingQuery = null;
          this.pendingQueryReject = null;
        } else {
          this.options.onError?.(error);
        }
        break;
      }

      case "result_header":
      case "query_result_header":
        // Store header, wait for binary
        this.pendingHeader = msg;
        break;
    }
  }

  private handleBinary(buffer: ArrayBuffer): void {
    const header = this.pendingHeader;
    this.pendingHeader = null;

    if (!header) {
      console.warn("Received binary without header");
      return;
    }

    const table = tableFromIPC(buffer);

    if (header.type === "result_header") {
      // Subscription result
      const callback = this.subscriptions.get(header.name);
      callback?.(table, header.tick);
    } else if (header.type === "query_result_header") {
      // One-off query result
      this.pendingQuery?.(table);
      this.pendingQuery = null;
      this.pendingQueryReject = null;
    }
  }
}
