import type { DataTableColumn } from './types';

/**
 * CSV export driven by the column definitions the table already has.
 *
 * Deliberately CSV and not xlsx. A real typed-cell workbook needs `exceljs`,
 * which is a ~900 KB dependency this package does not carry, and every ROBI
 * export that exists today is a CSV. When a screen genuinely needs formatted
 * numbers and real dates in Excel, add the writer beside this — the column
 * metadata below (`exportType`) is already shaped for it.
 *
 * What this replaces is worse than a missing feature: each screen had its own
 * `csvValue(row, columnId)` switch, a second list of columns kept in step with
 * the first by hand, whose `default:` branch returns an empty string. Add a
 * column and it exports blank until somebody notices.
 */

/**
 * Serialise one field for RFC 4180: quote when the value contains a comma, a
 * quote or a newline, and double any quote inside.
 */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

/** The columns that actually reach an export, in table order. */
function exportable<T>(columns: readonly DataTableColumn<T>[]): DataTableColumn<T>[] {
  return columns.filter((column) => !column.excludeFromExport && column.header !== undefined);
}

/**
 * One cell's value.
 *
 * A Date becomes an ISO day rather than a locale string: `dd/mm/yyyy` is read
 * as a date by a spreadsheet in one locale and as text in another, and the
 * export is a file someone else opens.
 */
function cell<T>(row: T, column: DataTableColumn<T>): unknown {
  const raw = column.exportValue
    ? column.exportValue(row)
    : column.field
      ? (row as Record<string, unknown>)[column.field]
      : '';

  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (column.exportType === 'date' && typeof raw === 'string' && raw) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
  }
  return raw;
}

/** Header row plus one line per row, `\r\n` terminated as RFC 4180 asks. */
export function toCsv<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[]): string {
  const cols = exportable(columns);
  const header = cols.map((column) => csvField(column.header)).join(',');
  const body = rows.map((row) => cols.map((column) => csvField(cell(row, column))).join(','));
  return [header, ...body].join('\r\n');
}

/** `deals` → `deals-2026-08-31-1408.csv`. Sortable, and unique per minute. */
export function exportFileName(name: string, now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}` + `-${p(now.getHours())}${p(now.getMinutes())}`;
  return `${name}-${stamp}.csv`;
}

/**
 * Build the CSV and hand it to the browser.
 *
 * The BOM is not decoration: without it Excel on Windows reads UTF-8 as the
 * system code page, and every customer name with an accent in it arrives
 * mangled. Split out from `toCsv` so the string can be tested without a DOM.
 */
export function downloadCsv<T>(rows: readonly T[], columns: readonly DataTableColumn<T>[], name: string): void {
  const blob = new Blob(['﻿', toCsv(rows, columns)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName(name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next frame rather than immediately: Safari has not always started
  // reading the blob when click() returns, and a revoked URL downloads nothing.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
