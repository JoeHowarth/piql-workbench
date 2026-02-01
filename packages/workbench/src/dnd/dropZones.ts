import type { DropPosition } from "../types";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Edge threshold as percentage of pane size
const EDGE_THRESHOLD = 0.3;

export function getDropPosition(
  mouseX: number,
  mouseY: number,
  rect: Rect,
): DropPosition {
  const relX = (mouseX - rect.left) / rect.width;
  const relY = (mouseY - rect.top) / rect.height;

  // Check edges first
  if (relX < EDGE_THRESHOLD) return "left";
  if (relX > 1 - EDGE_THRESHOLD) return "right";
  if (relY < EDGE_THRESHOLD) return "top";
  if (relY > 1 - EDGE_THRESHOLD) return "bottom";

  // Default to center
  return "center";
}

// Get the highlight area for a drop position
export function getDropZoneStyle(position: DropPosition): {
  top: string;
  left: string;
  width: string;
  height: string;
} {
  switch (position) {
    case "left":
      return { top: "0", left: "0", width: "30%", height: "100%" };
    case "right":
      return { top: "0", left: "70%", width: "30%", height: "100%" };
    case "top":
      return { top: "0", left: "0", width: "100%", height: "30%" };
    case "bottom":
      return { top: "70%", left: "0", width: "100%", height: "30%" };
    case "center":
      return { top: "30%", left: "30%", width: "40%", height: "40%" };
  }
}
