import type { PaneNode, TileSpec } from "workbench";
import { Workbench } from "workbench";
import { client } from "./piql";
import { setQueryLoading, setQueryResult, setQueryText } from "./queryStore";
import {
  setSmartVizGeneratedQuery,
  setSmartVizLoading,
  setSmartVizResult,
} from "./smartVizStore";
import { chartTile } from "./tiles/ChartTile";
import { dataframesTile } from "./tiles/DataFramesTile";
import { lineChartTile } from "./tiles/LineChartTile";
import { pickerTile } from "./tiles/PickerTile";
import { queryTile } from "./tiles/QueryTile";
import { scatterChartTile } from "./tiles/ScatterChartTile";
import { smartVizTile } from "./tiles/SmartVizTile";

const specs: TileSpec[] = [
  pickerTile(),
  dataframesTile(),
  queryTile(),
  chartTile(),
  lineChartTile(),
  scatterChartTile(),
  smartVizTile(),
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
      setQueryText(paneId, data.query);
      if (data.execute) {
        setQueryLoading(paneId, true);
        client
          .query(data.query)
          .then((table) => setQueryResult(paneId, table, null))
          .catch((e) =>
            setQueryResult(paneId, null, e instanceof Error ? e : new Error(String(e))),
          );
      }
    }
  }

  if (specId === "smartviz" && initialData && typeof initialData === "object") {
    const data = initialData as { query?: string; execute?: boolean };
    if (data.query) {
      setSmartVizGeneratedQuery(paneId, data.query);
      if (data.execute) {
        setSmartVizLoading(paneId, true);
        client
          .query(data.query)
          .then((table) => setSmartVizResult(paneId, data.query!, table, null))
          .catch((e) =>
            setSmartVizResult(paneId, data.query!, null, e instanceof Error ? e : new Error(String(e))),
          );
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
