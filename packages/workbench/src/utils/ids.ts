let counter = 0;

export function generatePaneId(): string {
  return `pane-${++counter}-${Math.random().toString(36).slice(2, 8)}`;
}
