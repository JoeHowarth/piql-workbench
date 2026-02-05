import { describe, expect, it } from "bun:test";
import { getEnterAction } from "./keyHandlers";

describe("getEnterAction", () => {
  it("returns 'submit' for plain Enter", () => {
    const event = { key: "Enter", shiftKey: false };
    expect(getEnterAction(event)).toBe("submit");
  });

  it("returns 'newline' for Shift+Enter", () => {
    const event = { key: "Enter", shiftKey: true };
    expect(getEnterAction(event)).toBe("newline");
  });

  it("returns null for other keys", () => {
    expect(getEnterAction({ key: "a", shiftKey: false })).toBe(null);
    expect(getEnterAction({ key: "Escape", shiftKey: false })).toBe(null);
    expect(getEnterAction({ key: "Tab", shiftKey: true })).toBe(null);
  });
});
