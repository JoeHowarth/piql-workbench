import { createContext, type JSX, useContext } from "solid-js";
import { createPiqlClient, type PiqlClient } from "./client";

const PiqlContext = createContext<PiqlClient>();

interface PiqlProviderProps {
  url: string;
  children: JSX.Element;
}

export function PiqlProvider(props: PiqlProviderProps) {
  const client = createPiqlClient(props.url);
  return (
    <PiqlContext.Provider value={client}>{props.children}</PiqlContext.Provider>
  );
}

export function usePiqlClient(): PiqlClient {
  const client = useContext(PiqlContext);
  if (!client) {
    throw new Error("usePiqlClient must be used within a PiqlProvider");
  }
  return client;
}
