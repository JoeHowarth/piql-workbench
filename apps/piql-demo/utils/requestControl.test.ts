import { describe, expect, it } from "bun:test";
import { createRoot } from "solid-js";
import { createRequestController, isAbortError } from "./requestControl";

describe("requestControl", () => {
  it("aborts previous request when a new one begins", () => {
    createRoot((dispose) => {
      const controller = createRequestController();
      const first = controller.begin();
      const second = controller.begin();

      expect(first.signal.aborted).toBe(true);
      expect(second.signal.aborted).toBe(false);
      expect(controller.isCurrent(first.token)).toBe(false);
      expect(controller.isCurrent(second.token)).toBe(true);

      dispose();
    });
  });

  it("treats DOM AbortError as abort", () => {
    const error = new DOMException("Aborted", "AbortError");
    expect(isAbortError(error)).toBe(true);
  });

  it("cancels active request on cleanup", () => {
    const signal = createRoot((dispose) => {
      const controller = createRequestController();
      const request = controller.begin();
      dispose();
      return request.signal;
    });

    expect(signal.aborted).toBe(true);
  });
});
