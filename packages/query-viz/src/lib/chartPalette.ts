// Accessible color palette (8 colors, works well for colorblind users)
export const CHART_PALETTE = [
  "#5470c6", // Blue
  "#91cc75", // Green
  "#fac858", // Yellow
  "#ee6666", // Red
  "#73c0de", // Light blue
  "#3ba272", // Teal
  "#fc8452", // Orange
  "#9a60b4", // Purple
];

export function getSeriesColor(index: number, override?: string): string {
  if (override) return override;
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

// Common ECharts grid settings
export const CHART_GRID = {
  left: 50,
  right: 20,
  top: 40,
  bottom: 40,
  containLabel: true,
};

// Common axis styling - subtle grid lines
export const CHART_AXIS_STYLE = {
  axisLine: {
    lineStyle: { color: "#4b5563" }, // gray-600
  },
  axisTick: {
    lineStyle: { color: "#4b5563" },
  },
  splitLine: {
    lineStyle: {
      color: "#374151", // gray-700 - subtle grid
      type: "dashed" as const,
    },
  },
  axisLabel: {
    color: "#9ca3af", // gray-400
  },
};

// Text style for consistency
export const CHART_TEXT_STYLE = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: 12,
};
