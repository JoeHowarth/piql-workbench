import { createSignal, Show, For, createMemo, onMount } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Component } from 'solid-js';
import { isNumericType, isBooleanType } from '../lib/arrow';
import type { FilterValue } from '../lib/types';

interface Props {
  columnName: string;
  columnType: string;
  currentFilter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
  uniqueValues?: unknown[];
}

export const ColumnFilter: Component<Props> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [position, setPosition] = createSignal({ top: 0, left: 0 });
  let buttonRef: HTMLButtonElement | undefined;

  const hasActiveFilter = () => props.currentFilter !== null && props.currentFilter !== undefined;

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen() && buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 2,
        left: Math.max(8, rect.left - 80),
      });
    }
    setIsOpen(!isOpen());
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    props.onFilterChange(null);
    setIsOpen(false);
  };

  return (
    <div class="inline-flex ml-0.5">
      <button
        ref={buttonRef}
        class="p-0.5 rounded transition-colors"
        classList={{
          'text-blue-600': hasActiveFilter(),
          'text-gray-300 hover:text-gray-500': !hasActiveFilter(),
        }}
        onClick={handleToggle}
        title={hasActiveFilter() ? 'Filter active' : 'Filter'}
      >
        <FilterIcon />
      </button>

      <Show when={isOpen()}>
        <Portal>
          <div
            class="fixed inset-0 z-[100]"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(false); }}
            onMouseDown={(e) => e.preventDefault()}
          />
          <div
            class="fixed z-[101] bg-white rounded shadow-lg border border-gray-200 py-2 min-w-[160px] max-w-[240px]"
            style={{ top: `${position().top}px`, left: `${position().left}px` }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div class="px-2 pb-1 mb-1 border-b border-gray-100 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500">{props.columnName}</span>
              <Show when={hasActiveFilter()}>
                <button class="text-xs text-red-500 hover:text-red-600" onClick={handleClear}>
                  Clear
                </button>
              </Show>
            </div>

            <Show when={isNumericType(props.columnType)}>
              <NumericFilter
                value={props.currentFilter as [number, number] | null}
                onChange={(v) => { props.onFilterChange(v); if (v !== null) setIsOpen(false); }}
              />
            </Show>

            <Show when={isBooleanType(props.columnType)}>
              <BooleanFilter
                value={props.currentFilter as number | null}
                onChange={(v) => { props.onFilterChange(v); setIsOpen(false); }}
              />
            </Show>

            <Show when={!isNumericType(props.columnType) && !isBooleanType(props.columnType)}>
              <TextFilter
                value={props.currentFilter as string[] | string | null}
                uniqueValues={props.uniqueValues}
                onChange={props.onFilterChange}
              />
            </Show>
          </div>
        </Portal>
      </Show>
    </div>
  );
};

const FilterIcon: Component = () => (
  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
  </svg>
);

const TextFilter: Component<{
  value: string[] | string | null;
  uniqueValues?: unknown[];
  onChange: (v: FilterValue) => void;
}> = (props) => {
  const [search, setSearch] = createSignal('');

  // Convert current value to Set for easy lookup
  const selectedSet = createMemo(() => {
    const v = props.value;
    if (v === null) return new Set<string>();
    if (Array.isArray(v)) return new Set(v);
    return new Set([v]);
  });

  // Get unique string values, filtered by search
  const filteredValues = createMemo(() => {
    const values = (props.uniqueValues ?? [])
      .map(v => String(v ?? ''))
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique
      .sort();

    const s = search().toLowerCase();
    if (!s) return values;
    return values.filter(v => v.toLowerCase().includes(s));
  });

  const allSelected = createMemo(() => {
    const filtered = filteredValues();
    if (filtered.length === 0) return false;
    return filtered.every(v => selectedSet().has(v));
  });

  const toggleValue = (val: string) => {
    const current = new Set(selectedSet());
    if (current.has(val)) {
      current.delete(val);
    } else {
      current.add(val);
    }
    if (current.size === 0) {
      props.onChange(null);
    } else {
      props.onChange([...current]);
    }
  };

  const toggleAll = () => {
    const filtered = filteredValues();
    if (allSelected()) {
      // Deselect all filtered values
      const current = new Set(selectedSet());
      filtered.forEach(v => current.delete(v));
      props.onChange(current.size === 0 ? null : [...current]);
    } else {
      // Select all filtered values
      const current = new Set(selectedSet());
      filtered.forEach(v => current.add(v));
      props.onChange([...current]);
    }
  };

  // If no unique values provided, fall back to text search
  if (!props.uniqueValues || props.uniqueValues.length === 0) {
    return <TextSearchFilter value={typeof props.value === 'string' ? props.value : null} onChange={props.onChange} />;
  }

  return (
    <div>
      <div class="px-2 pb-1">
        <input
          type="text"
          class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
          placeholder="Search..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>
      <div class="max-h-[200px] overflow-y-auto">
        <label class="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            class="rounded text-blue-600"
            checked={allSelected()}
            ref={(el) => { el.indeterminate = selectedSet().size > 0 && !allSelected(); }}
            onChange={toggleAll}
          />
          <span class="text-xs text-gray-600 italic">
            {allSelected() ? 'Deselect all' : 'Select all'}
          </span>
        </label>
        <div class="border-t border-gray-100 mt-1 pt-1">
          <For each={filteredValues()}>
            {(val) => (
              <label class="flex items-center gap-2 px-2 py-0.5 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  class="rounded text-blue-600"
                  checked={selectedSet().has(val)}
                  onChange={() => toggleValue(val)}
                />
                <span class="text-xs truncate" title={val}>{val || '(empty)'}</span>
              </label>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

const TextSearchFilter: Component<{
  value: string | null;
  onChange: (v: FilterValue) => void;
}> = (props) => {
  const [local, setLocal] = createSignal(props.value ?? '');
  let inputRef: HTMLInputElement | undefined;
  onMount(() => inputRef?.focus());

  const handleSubmit = () => {
    const v = local().trim();
    props.onChange(v || null);
  };

  return (
    <div class="px-2 space-y-1">
      <input
        ref={inputRef}
        type="text"
        class="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
        placeholder="Contains..."
        value={local()}
        onInput={(e) => setLocal(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <button
        class="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleSubmit}
      >
        Apply
      </button>
    </div>
  );
};

const NumericFilter: Component<{
  value: [number, number] | number | null;
  onChange: (v: FilterValue) => void;
}> = (props) => {
  const initial = Array.isArray(props.value)
    ? props.value.map(v => v === -Infinity || v === Infinity ? null : v)
    : [null, null];
  const [min, setMin] = createSignal<string>(initial[0]?.toString() ?? '');
  const [max, setMax] = createSignal<string>(initial[1]?.toString() ?? '');
  let inputRef: HTMLInputElement | undefined;
  onMount(() => inputRef?.focus());

  const handleSubmit = () => {
    const minVal = min() ? parseFloat(min()) : -Infinity;
    const maxVal = max() ? parseFloat(max()) : Infinity;
    if (minVal === -Infinity && maxVal === Infinity) {
      props.onChange(null);
    } else {
      props.onChange([minVal, maxVal]);
    }
  };

  return (
    <div class="px-2 space-y-1">
      <div class="flex gap-1 items-center">
        <input
          ref={inputRef}
          type="number"
          class="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
          placeholder="Min"
          value={min()}
          onInput={(e) => setMin(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <span class="text-gray-400 text-xs">–</span>
        <input
          type="number"
          class="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-blue-400"
          placeholder="Max"
          value={max()}
          onInput={(e) => setMax(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <button
        class="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleSubmit}
      >
        Apply
      </button>
    </div>
  );
};

const BooleanFilter: Component<{
  value: number | null;
  onChange: (v: FilterValue) => void;
}> = (props) => {
  return (
    <div class="px-1">
      {[
        { value: null, label: 'All' },
        { value: 1, label: 'True' },
        { value: 0, label: 'False' },
      ].map((opt) => (
        <button
          class="w-full text-left px-2 py-1 text-xs rounded transition-colors"
          classList={{
            'bg-blue-50 text-blue-700': props.value === opt.value,
            'hover:bg-gray-50': props.value !== opt.value,
          }}
          onClick={() => props.onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
