import type { Component } from 'solid-js';
import { isNumericType, isTemporalType, isBooleanType } from '../lib/arrow';
import type { ColumnConfig } from '../lib/types';

interface Props {
  value: unknown;
  type: string;
  width: number;
  config?: ColumnConfig;
  compact?: boolean;
}

function formatValue(
  value: unknown,
  type: string,
  config?: ColumnConfig
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (isNumericType(type)) {
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  if (isTemporalType(type)) {
    const date = value instanceof Date ? value : new Date(Number(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  if (isBooleanType(type)) {
    const display = config?.booleanDisplay ?? 'checkmark';
    if (display === 'checkmark') {
      return value ? '✓' : '✗';
    }
    return value ? 'true' : 'false';
  }

  return String(value);
}

export const TableCell: Component<Props> = (props) => {
  const isNumeric = () => isNumericType(props.type);
  const isBool = () => isBooleanType(props.type);
  const isNull = () => props.value === null || props.value === undefined;

  const statusColor = () => {
    if (!props.config?.statusColors) return null;
    const val = String(props.value ?? '');
    return props.config.statusColors[val] ?? null;
  };

  return (
    <td
      class="border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 truncate"
      classList={{
        'px-3 py-1.5': !props.compact,
        'px-2 py-1': props.compact,
        'text-right tabular-nums': isNumeric(),
        'text-center': isBool(),
        'text-gray-400 dark:text-gray-500': isNull(),
        'text-green-600 dark:text-green-400': statusColor() === 'green',
        'text-red-600 dark:text-red-400': statusColor() === 'red',
        'text-yellow-600 dark:text-yellow-400': statusColor() === 'yellow',
        'text-blue-600 dark:text-blue-400': statusColor() === 'blue',
        'text-gray-600 dark:text-gray-400': statusColor() === 'gray',
      }}
      style={{ width: `${props.width}px`, 'max-width': `${props.width}px` }}
      title={String(props.value ?? '')}
    >
      {formatValue(props.value, props.type, props.config)}
    </td>
  );
};
