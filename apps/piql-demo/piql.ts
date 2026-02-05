// Switch between real and mock PiQL client
// Use ?server=mock for mock, otherwise connects to real server

import { createPiqlClient, type PiqlClient } from "piql-client";
import { createMockClient } from "./mockClient";

const params = new URLSearchParams(window.location.search);
const serverParam = params.get("server");

export const USE_MOCK = serverParam === "mock";

export const PIQL_URL =
  serverParam && serverParam !== "mock"
    ? serverParam
    : (import.meta.env.VITE_PIQL_URL ?? "/api");

export const client: PiqlClient = USE_MOCK
  ? createMockClient()
  : createPiqlClient(PIQL_URL);
