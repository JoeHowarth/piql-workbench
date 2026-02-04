// Switch between real and mock PiQL client
// Use ?server=mock for mock, otherwise connects to real server

import {
  PiqlProvider as RealPiqlProvider,
  usePiqlClient as useRealPiqlClient,
} from "piql-client/solid";
import {
  MockPiqlProvider,
  usePiqlClient as useMockPiqlClient,
} from "./MockPiqlProvider";

const params = new URLSearchParams(window.location.search);
const serverParam = params.get("server");

export const USE_MOCK = serverParam === "mock";

export const PIQL_URL =
  serverParam && serverParam !== "mock"
    ? serverParam
    : (import.meta.env.VITE_PIQL_URL ?? "ws://localhost:9000");

export const PiqlProvider = USE_MOCK ? MockPiqlProvider : RealPiqlProvider;
export const usePiqlClient = USE_MOCK ? useMockPiqlClient : useRealPiqlClient;
