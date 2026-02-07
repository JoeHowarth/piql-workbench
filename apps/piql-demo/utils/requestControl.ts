import { onCleanup } from "solid-js";

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function createRequestController() {
  let activeController: AbortController | null = null;
  let currentToken = 0;

  const begin = () => {
    currentToken += 1;
    activeController?.abort();
    activeController = new AbortController();

    return {
      token: currentToken,
      signal: activeController.signal,
    };
  };

  const isCurrent = (token: number) => token === currentToken;

  const cancel = () => {
    activeController?.abort();
    activeController = null;
  };

  onCleanup(cancel);

  return {
    begin,
    isCurrent,
    cancel,
  };
}
