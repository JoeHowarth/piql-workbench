import type { PaneNode, TileSpec } from "workbench";
import { Workbench } from "workbench";
import { askTile } from "./tiles/AskTile";
import { chartTile } from "./tiles/ChartTile";
import { pickerTile } from "./tiles/PickerTile";
import { queryTile } from "./tiles/QueryTile";

const specs: TileSpec[] = [pickerTile(), queryTile(), askTile(), chartTile()];

const initialLayout: PaneNode = {
  type: "split",
  id: "root",
  dir: "h",
  sizes: [{ px: 180 }, 100],
  children: [
    { type: "leaf", id: "picker-pane", specId: "picker" },
    {
      type: "split",
      id: "main",
      dir: "h",
      sizes: [50, 50],
      children: [
        { type: "leaf", id: "query-pane", specId: "query" },
        { type: "leaf", id: "chart-pane", specId: "chart" },
      ],
    },
  ],
};

export default function App() {
  return (
    <div class="h-screen bg-gray-100 dark:bg-gray-950 p-2">
      <Workbench specs={specs} initialLayout={initialLayout} class="h-full" />
    </div>
  );
}
