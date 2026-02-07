# query-viz

A workbench for understanding simulations. Write queries against live data, arrange tables and charts in draggable panes, and watch everything update as the simulation ticks forward.

Built with SolidJS, Apache Arrow, and ECharts.

## The idea

Simulations produce a lot of data. The usual approach — dump to CSV, open in a notebook, squint at numbers — breaks down when you need to *watch* what's happening as it unfolds. You want multiple views of the same evolving state, the ability to ask questions on the fly, and instant feedback without round-tripping to the server for every sort or filter.

query-viz is three packages that compose into that experience:

- **`query-viz`** — Tables and charts that speak Arrow natively. Virtualized, sortable, filterable, with schema-inferred formatting and chart type inference.
- **`workbench`** — A drag-and-drop pane layout. Split, resize, rearrange, focus. The layout is a tree you can restructure while the simulation runs.
- **`piql-client`** — A typed client for PiQL backends. One-off queries, SSE subscriptions for streaming updates, and a natural language endpoint that generates PiQL from plain English.

## PiQL queries

PiQL uses a Polars-inspired fluent syntax. Queries are plain text, executed server-side, with results returned as Arrow IPC — no JSON, no type loss.

```python
# grab the first 50 orders
orders.head(50)

# select specific columns
transactions.select(pl.col('tx_type'), pl.col('amount'))

# chain operations
items.select(pl.col('name'), pl.col('price')).head(10)
```

The `ask` endpoint translates natural language into PiQL:

```
"show top 7 orders"  →  orders.head(7)
"top 5 items"        →  items.head(5)
```

Follow-up questions carry context from previous results, so you can iteratively refine: start with a broad query, then narrow down by asking "now filter to just the expensive ones" or "group by category."

## The workbench

The layout is a recursive tree of splits and leaves. You define an initial layout, register tile types, and the workbench handles drag-drop, resizing, and focus mode:

```tsx
const specs: TileSpec[] = [
  pickerTile(),
  timeControlsTile(),
  queryTile(),
  tableTile("orders", { label: "Orders", rowCount: 100 }),
  tableTile("inventory", { label: "Inventory", rowCount: 75 }),
];

const initialLayout: PaneNode = {
  type: "split", id: "root", dir: "h",
  sizes: [{ px: 180 }, 100],
  children: [
    {
      type: "split", id: "sidebar", dir: "v",
      sizes: [{ px: 80 }, 100],
      children: [
        { type: "leaf", id: "time-pane", specId: "time-controls" },
        { type: "leaf", id: "picker-pane", specId: "picker" },
      ],
    },
    { type: "leaf", id: "content-pane", specId: "orders" },
  ],
};

<Workbench specs={specs} initialLayout={initialLayout} />
```

Drop a tile on an edge to split. Drop on the center to replace. Sizes can be percentages (resizable) or fixed pixels (for sidebars). Pane IDs are preserved when you drag tiles around, so per-pane state survives rearrangement.

## Watching a simulation

The workbench-demo shows the pattern:

1. **Time controls** drive a `tick` signal with play/pause and adjustable speed (0.06x to 16x).
2. **Table tiles** regenerate their data each tick — same schema, different values. You see the simulation state evolving in real time.
3. **Query tiles** let you run arbitrary PiQL against the current state. Stale requests are automatically cancelled via AbortSignal.
4. **SmartViz tiles** accept a plain-English question, generate PiQL, execute it, and infer the right visualization (table, bar, line, or scatter) from the result schema.

Because sort, filter, and chart inference all run client-side over the Arrow data, interaction is instant. The server only gets involved when you need new data.

## SmartViz

The SmartViz tile chains natural language → PiQL generation → query execution → schema-based chart inference into a single flow:

1. Type a question: *"show orders by category"*
2. The backend generates PiQL: `orders.select(pl.col('category'), pl.col('amount'))`
3. The query executes and returns an Arrow table
4. The UI infers: string + numeric columns → bar chart

You can switch between table/bar/line/scatter views. Duplicate a SmartViz tile to preserve one view while exploring a variation. Follow-up questions include sample rows from the previous result as context, so the backend can refine intelligently.

## Data pipeline

```
Arrow Table (from query or SSE subscription)
  │
  ├─ useArrowData()     → schema + rows
  │    │
  │    └─ useDerivedRows()  → client-side sort/filter
  │         │
  │         └─ DataFrameTable   → virtualized DOM (only visible rows render)
  │
  └─ useChartSeries()   → ECharts options (axis types inferred from Arrow schema)
       │
       └─ BaseChart         → Canvas rendering
```

Arrow IPC preserves the full type system — bigint, timestamps, decimals — so the UI can format cells correctly, choose appropriate filter widgets (range sliders for numbers, multi-select for strings, toggle for booleans), and map axes without guessing.

## Packages

| Package | What it does |
|---------|-------------|
| `query-viz` | `DataFrameTable`, `LineChart`, `BarChart`, `ScatterChart`, hooks for Arrow data, derived rows, chart series |
| `workbench` | `Workbench` component, `DraggableItem`, pane context hooks (`usePaneId`, `useWorkbench`, `useFocusMode`) |
| `piql-client` | `createPiqlClient(baseUrl)` with `query()`, `subscribe()`, `ask()`, `listDataframes()` |

## Running

```bash
bun install
bun run test:unit          # unit tests
bun run test:e2e           # playwright e2e tests
bun run build:demos        # build all demo apps
bun run check:budgets      # enforce bundle size limits
```

Three demo apps live in `apps/`:

- **demo** — basic table rendering
- **piql-demo** — query editor, SmartViz, charts, multi-pane state
- **workbench-demo** — time controls, live-updating tables, drag-drop layout

## Key decisions

**Arrow IPC, not JSON.** Polars uses Arrow internally, so serialization is essentially free. The browser parses it with `apache-arrow`, preserving column types without JSON's lossy coercions.

**Client-side derivation.** Sorting, filtering, and chart type inference run locally over the Arrow data. The server is only for fetching new result sets.

**Fine-grained reactivity.** SolidJS signals mean only changed cells re-render on live updates. A 1000-row table with one cell changing doesn't repaint the other 999 rows.

**Virtualized rendering.** Tables over 80 rows only render the visible window plus an 8-row buffer. Large datasets don't bloat the DOM.

**Request cancellation.** Every query carries an AbortSignal. Typing fast in the query editor doesn't stack up stale responses — each new request cancels the previous one.

**Immutable layout tree.** Drag-drop and resize operations produce new trees rather than mutating in place. Size overrides are stored separately so resizing a handle doesn't trigger a full layout recalculation.
