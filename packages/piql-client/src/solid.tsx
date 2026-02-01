import type { Table } from "apache-arrow";
import {
  type Accessor,
  type Component,
  createContext,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { PiqlClient, type PiqlClientOptions } from "./client";

// ============ Context ============

const PiqlContext = createContext<PiqlClient>();

export interface PiqlProviderProps extends PiqlClientOptions {
  url: string;
  children: JSX.Element;
}

export const PiqlProvider: Component<PiqlProviderProps> = (props) => {
  const client = new PiqlClient(props.url, {
    onConnect: props.onConnect,
    onDisconnect: props.onDisconnect,
    onError: props.onError,
  });

  onMount(() => {
    client.connect();
  });

  onCleanup(() => {
    client.disconnect();
  });

  return (
    <PiqlContext.Provider value={client}>{props.children}</PiqlContext.Provider>
  );
};

export function usePiqlClient(): PiqlClient {
  const client = useContext(PiqlContext);
  if (!client) {
    throw new Error("usePiqlClient must be used within a PiqlProvider");
  }
  return client;
}

// ============ Subscription Hook ============

export interface SubscriptionResult {
  table: Accessor<Table | null>;
  tick: Accessor<number>;
  error: Accessor<Error | null>;
}

/**
 * Subscribe to a PiQL query and get reactive Table updates
 *
 * @example
 * ```tsx
 * const { table, tick } = useSubscription("rich", "entities.filter($gold > 100)");
 *
 * return <DataFrameTable table={table} />;
 * ```
 */
export function useSubscription(
  name: string,
  query: string,
): SubscriptionResult {
  const client = usePiqlClient();

  const [table, setTable] = createSignal<Table | null>(null);
  const [tick, setTick] = createSignal(0);
  const [error, setError] = createSignal<Error | null>(null);

  onMount(() => {
    try {
      client.subscribe(name, query, (t, tk) => {
        setTable(() => t);
        setTick(tk);
        setError(null);
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  });

  onCleanup(() => {
    client.unsubscribe(name);
  });

  return { table, tick, error };
}

// ============ One-off Query Hook ============

export interface QueryResult {
  table: Accessor<Table | null>;
  loading: Accessor<boolean>;
  error: Accessor<Error | null>;
  refetch: () => void;
}

/**
 * Execute a one-off query
 *
 * @example
 * ```tsx
 * const { table, loading, refetch } = useQuery("entities.head(10)");
 * ```
 */
export function useQuery(query: string): QueryResult {
  const client = usePiqlClient();

  const [table, setTable] = createSignal<Table | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);

  const execute = () => {
    setLoading(true);
    setError(null);

    client
      .query(query)
      .then((t) => {
        setTable(() => t);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  onMount(execute);

  return { table, loading, error, refetch: execute };
}

// ============ List DataFrames Hook ============

export interface ListDfsResult {
  names: Accessor<string[]>;
  loading: Accessor<boolean>;
  error: Accessor<Error | null>;
  refetch: () => void;
}

/**
 * List available dataframes
 */
export function useListDfs(): ListDfsResult {
  const client = usePiqlClient();

  const [names, setNames] = createSignal<string[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);

  const execute = () => {
    setLoading(true);
    setError(null);

    client
      .listDfs()
      .then((n) => {
        setNames(n);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  onMount(execute);

  return { names, loading, error, refetch: execute };
}
