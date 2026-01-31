# query-viz

SolidJS component for rendering Polars/Arrow dataframes with live updates.

## Why

Render dataframes sent from a Rust/Python backend via Arrow IPC. Optimized for:
- **100-1000 rows**, tens of columns
- **Live updates** at 1-2 second intervals
- Client-side sort/filter/resize without server roundtrips

## Core decisions

**Arrow IPC as transport** — Polars uses Arrow internally, so serialization is essentially free. The browser parses it with `apache-arrow` JS, preserving column types (numbers, dates, booleans) without JSON's quirks.

**SolidJS store + reconcile** — When new data arrives, `reconcile()` diffs against the previous state. Only changed cells trigger re-renders, not the whole table. This matters for live updates.

**Schema-inferred rendering** — Column types from Arrow schema drive cell formatting (right-align numbers, format dates, checkmarks for booleans) and filter UI (range inputs for numbers, multi-select checkboxes for strings).

**Derived state, not mutation** — Sorting and filtering are computed signals over the original data. The source rows are never mutated.

## API

```tsx
<DataFrameTable
  data={arrowBufferSignal}  // Accessor<ArrayBuffer | null>
  config={{
    columns: {
      price: { label: 'Price ($)', width: 100 },
      status: {
        statusColors: { 'In Stock': 'green', 'Out of Stock': 'red' }
      },
      internal_id: { hidden: true },
    },
    defaultSort: { column: 'id', dir: 'asc' },
    stickyHeader: true,
    stripedRows: true,
    density: 'compact',
  }}
/>
```

Config is optional — the table will render with sensible defaults inferred from the Arrow schema.
