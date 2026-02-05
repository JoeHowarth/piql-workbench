import type { PaneNode, TileSpec } from "workbench";
import { Workbench } from "workbench";
import { client } from "./piql";
import { setQueryLoading, setQueryResult, setQueryText } from "./queryStore";
import { askTile } from "./tiles/AskTile";
import { chartTile } from "./tiles/ChartTile";
import { dataframesTile } from "./tiles/DataFramesTile";
import { pickerTile } from "./tiles/PickerTile";
import { queryTile } from "./tiles/QueryTile";

const specs: TileSpec[] = [
  pickerTile(),
  dataframesTile(),
  queryTile(),
  askTile(),
  chartTile(),
];

const initialLayout: PaneNode = {
  type: "split",
  id: "root",
  dir: "h",
  sizes: [{ px: 180 }, 100],
  children: [
    {
      type: "split",
      id: "sidebar",
      dir: "v",
      sizes: [50, 50],
      children: [
        { type: "leaf", id: "picker-pane", specId: "picker" },
        { type: "leaf", id: "dataframes-pane", specId: "dataframes" },
      ],
    },
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

/** Initialize tile state when a new tile is created via drag-drop */
function handleTileAdded(paneId: string, specId: string, initialData?: unknown) {
  console.log("[handleTileAdded]", { paneId, specId, initialData });

  if (specId === "query" && initialData && typeof initialData === "object") {
    const data = initialData as { query?: string; execute?: boolean };
    if (data.query) {
      console.log("[handleTileAdded] setting query text:", data.query);
      setQueryText(paneId, data.query);

      if (data.execute) {
        console.log("[handleTileAdded] executing query...");
        setQueryLoading(paneId, true);
        client
          .query(data.query)
          .then((table) => {
            console.log("[handleTileAdded] query success:", table.numRows, "rows");
            setQueryResult(paneId, table, null);
          })
          .catch((e) => {
            console.error("[handleTileAdded] query error:", e);
            setQueryResult(paneId, null, e instanceof Error ? e : new Error(String(e)));
          });
      }
    }
  }
}

export default function App() {
  return (
    <div class="h-screen bg-gray-100 dark:bg-gray-950 p-2">
      <Workbench
        specs={specs}
        initialLayout={initialLayout}
        onTileAdded={handleTileAdded}
        class="h-full"
      />
    </div>
  );
}
