import { DataFrameTable } from "query-viz";
import { createSignal, onCleanup } from "solid-js";
import { createMockArrowBuffer } from "./mockData";

export default function App() {
  const [data, setData] = createSignal<ArrayBuffer | null>(
    createMockArrowBuffer(100),
  );
  const [isLive, setIsLive] = createSignal(false);

  // Live update simulation
  let intervalId: number | undefined;

  const toggleLive = () => {
    if (isLive()) {
      clearInterval(intervalId);
      intervalId = undefined;
      setIsLive(false);
    } else {
      intervalId = window.setInterval(() => {
        setData(createMockArrowBuffer(100));
      }, 2000);
      setIsLive(true);
    }
  };

  onCleanup(() => {
    if (intervalId) clearInterval(intervalId);
  });

  const refreshData = () => {
    setData(createMockArrowBuffer(100));
  };

  return (
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          DataFrameTable Demo
        </h1>
        <p class="text-gray-600 mb-4">
          Click column headers to sort. Data is rendered from Arrow IPC format.
        </p>

        <div class="mb-4 flex gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={refreshData}
          >
            Refresh Data
          </button>
          <button
            class="px-4 py-2 rounded transition-colors"
            classList={{
              "bg-green-600 text-white hover:bg-green-700": isLive(),
              "bg-gray-200 text-gray-700 hover:bg-gray-300": !isLive(),
            }}
            onClick={toggleLive}
          >
            {isLive() ? "Live Updates: ON" : "Live Updates: OFF"}
          </button>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <DataFrameTable
            data={data}
            config={{
              columns: {
                id: { label: "ID", width: 60 },
                name: { label: "Product Name", width: 180 },
                price: { label: "Price ($)", width: 100 },
                quantity: { label: "Qty", width: 80 },
                in_stock: { label: "In Stock", width: 70 },
                status: {
                  label: "Status",
                  width: 110,
                  statusColors: {
                    "In Stock": "green",
                    "Low Stock": "yellow",
                    "Out of Stock": "red",
                    Discontinued: "gray",
                  },
                },
                updated_at: { label: "Last Updated", width: 180 },
              },
              defaultSort: { column: "id", dir: "asc" },
              stickyHeader: true,
              stripedRows: true,
              density: "compact",
            }}
            class="max-h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}
