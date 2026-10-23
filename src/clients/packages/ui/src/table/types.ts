/** A column definition, as consumers write it. */
export interface DataTableColumn<T> {
  /** Stable identifier. Sort, filter and the per-column slot all key off it. */
  id: string;
  /** Header text. Omit for an actions column. */
  header?: string;
  /**
   * Property to read for the default cell rendering, sorting and filtering.
   * Omit for a derived column, and supply a `#cell-<id>` slot instead — but
   * note a column with no field cannot be sorted or filtered by the pipeline,
   * because there is nothing to compare.
   */
  field?: keyof T & string;
  sortable?: boolean;
  /**
   * Include this column's value in the free-text `search` query.
   * Distinct from the `#filters` slot, which is free-form filter chrome
   * the caller owns and applies outside the table.
   */
  filterable?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Any CSS width. Applied via <colgroup>, so it survives table layout. */
  width?: string;
  /** Custom comparator, for values that do not sort sensibly as strings. */
  sort?: (a: unknown, b: unknown) => number;

  /* --- Export ----------------------------------------------------------- *
   * Declared on the column rather than in a per-screen switch. A switch is a
   * second list of columns that has to be kept in step with the first by hand,
   * and its `default:` branch exports an empty string when it is not — a
   * column added to the table quietly exports blank until someone notices.
   */

  /**
   * How this column reaches an export, for a column whose cell renders a slot
   * (a link, a badge, a formatted composite) rather than a plain field.
   *
   * Return the UNDERLYING value, not the string on screen: an amount as a
   * number, a date as a Date. A spreadsheet cell holding "$85.00" is a label
   * where 85 is a figure you can sum. Falls back to `field` when omitted.
   */
  exportValue?: (row: T) => string | number | boolean | Date | null | undefined;
  /**
   * What the exported cells ARE. Only `date` changes today's CSV output (an
   * ISO day rather than a locale string), but stating it keeps the column
   * honest for a typed-cell writer later.
   */
  exportType?: 'text' | 'number' | 'date';
  /** Leave this column out entirely — an actions or selection column. */
  excludeFromExport?: boolean;
}

/**
 * Single-column sort direction as a controlled model.
 *
 * Bind `v-model:sort` on DataTable to take ownership of the sort — header
 * clicks then cycle THIS instead of v0's internal state, and it is up to the
 * consumer to reorder the rows (typically because sort is server-side and the
 * table only ever sees one page). `null` means no column sorted;
 * `undefined` on the model means uncontrolled — the built-in v0 sort applies.
 */
export type DataTableSort = { id: string; direction: 'asc' | 'desc' } | null;

export type DataTableDensity = 'compact' | 'standard' | 'comfortable';

const DENSITY_VALUES: readonly DataTableDensity[] = ['compact', 'standard', 'comfortable'];

export function isDataTableDensity(value: unknown): value is DataTableDensity {
  return typeof value === 'string' && (DENSITY_VALUES as readonly string[]).includes(value);
}

/** Options for a density ToggleGroup or TableDensityMenu — labels match the density tokens. */
export const DATA_TABLE_DENSITY_OPTIONS: readonly {
  value: DataTableDensity;
  label: string;
}[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'comfortable', label: 'Comfortable' },
];
