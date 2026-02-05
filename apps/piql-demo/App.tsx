import type { PaneNode, TileSpec } from "workbench";
import { Workbench } from "workbench";
import { PIQL_URL, PiqlProvider } from "./piql";
import { pickerTile } from "./tiles/PickerTile";
import { queryTile } from "./tiles/QueryTile";

const specs: TileSpec[] = [pickerTile(), queryTile()];

const initialLayout: PaneNode = {
  type: "split",
  id: "root",
  dir: "h",
  sizes: [{ px: 180 }, 100],
  children: [
    { type: "leaf", id: "picker-pane", specId: "picker" },
    { type: "leaf", id: "query-pane", specId: "query" },
  ],
};

export default function App() {
  return (
    <PiqlProvider url={PIQL_URL}>
      <div class="h-screen bg-gray-100 dark:bg-gray-950 p-2">
        <Workbench specs={specs} initialLayout={initialLayout} class="h-full" />
      </div>
    </PiqlProvider>
  );
}
