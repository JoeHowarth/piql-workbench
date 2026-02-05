/**
 * Determines the action for a keydown event in the code input.
 * Returns "submit" for Enter, "newline" for Shift+Enter, null otherwise.
 */
export function getEnterAction(event: {
  key: string;
  shiftKey: boolean;
}): "submit" | "newline" | null {
  if (event.key !== "Enter") {
    return null;
  }
  return event.shiftKey ? "newline" : "submit";
}
