/*
 * Key/value map editing — the ordered rows an operator sees, and the plain
 * object the config file holds. Pure, because the interesting part is the
 * mismatch between those two and it is worth pinning down in tests.
 *
 * ── WHY ROWS AND A RECORD ARE BOTH NEEDED ─────────────────────────────────
 *
 * A `Record<string, string>` cannot hold a half-typed map. It has no order, so
 * rows jump around as keys are edited; it cannot hold two rows with the same
 * key, so typing a key that briefly collides destroys the other row's value;
 * and it cannot hold a row with no key yet, so pressing "Add" and seeing
 * nothing appear is the natural consequence.
 *
 * So the editor holds ROWS — ordered, duplicable, incomplete — and derives the
 * record from them. The rows are the truth while editing; the record is the
 * truth once saved. `rowsError` is what stands between the two, and it is
 * reported rather than silently resolved: dropping a duplicate key on the
 * operator's behalf loses a value they typed and cannot see they have lost.
 */

export interface KeyValueRow {
  /** Stable across reorders and key edits, so Vue's :key does not reuse inputs. */
  id: string;
  key: string;
  value: string;
}

export interface KeyRules {
  /** Keys must match this — e.g. an env-var convention. */
  pattern?: RegExp;
  patternMessage?: string;
  maxKeyLength?: number;
  /** Treat `Timeout` and `timeout` as the same key. */
  caseInsensitive?: boolean;
}

let counter = 0;

/*
 * Ids are sequential rather than random because crypto.randomUUID is not
 * available everywhere this runs (older WebViews, and jsdom without a polyfill)
 * and Math.random is banned in some of the tooling here. They only have to be
 * unique within one mounted editor, which a module counter satisfies.
 */
export function newRowId(): string {
  counter += 1;
  return `kv-${counter}`;
}

export function emptyRow(): KeyValueRow {
  return { id: newRowId(), key: '', value: '' };
}

/** A record, in its natural order, as the rows an editor can work with. */
export function toRows(record: Record<string, string> | null | undefined): KeyValueRow[] {
  if (record === null || record === undefined) return [];
  return Object.entries(record).map(([key, value]) => ({ id: newRowId(), key, value: String(value ?? '') }));
}

/**
 * Rows → the record that gets stored.
 *
 * Keyless rows are skipped and a duplicate key keeps its LAST value, matching
 * what `Object.fromEntries` would do — but neither is treated as acceptable:
 * `rowsError` reports both, and the editor is expected to show it. This
 * function exists so a parent always has a well-formed object to bind, not so
 * the problem can be ignored.
 */
export function toRecord(rows: readonly KeyValueRow[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key === '') continue;
    record[key] = row.value;
  }
  return record;
}

function comparableKey(key: string, rules?: KeyRules): string {
  return rules?.caseInsensitive === true ? key.trim().toLowerCase() : key.trim();
}

/** Every row index whose key repeats an earlier one. */
export function duplicateKeyIndexes(rows: readonly KeyValueRow[], rules?: KeyRules): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  rows.forEach((row, index) => {
    const key = comparableKey(row.key, rules);
    if (key === '') return;
    if (seen.has(key)) duplicates.push(index);
    else seen.add(key);
  });

  return duplicates;
}

/** Why one key is not acceptable on its own — shape only, not uniqueness. */
export function keyError(key: string, rules?: KeyRules): string | undefined {
  const trimmed = key.trim();
  if (trimmed === '') return undefined; // An empty new row is not yet wrong.
  if (rules?.maxKeyLength !== undefined && trimmed.length > rules.maxKeyLength) {
    return `Keys are limited to ${rules.maxKeyLength} characters.`;
  }
  if (rules?.pattern !== undefined && !rules.pattern.test(trimmed)) {
    return rules.patternMessage ?? 'That key is not allowed here.';
  }
  return undefined;
}

/**
 * The one message for the whole editor, or undefined when it is saveable.
 *
 * Deliberately a single message rather than one per row: the failures are about
 * the SET of rows — this key duplicates that one, this value has no key to
 * belong to — and a per-row message cannot say which other row it means.
 */
export function rowsError(rows: readonly KeyValueRow[], rules?: KeyRules): string | undefined {
  for (const row of rows) {
    const problem = keyError(row.key, rules);
    if (problem !== undefined) return problem;
  }

  const duplicates = duplicateKeyIndexes(rows, rules);
  if (duplicates.length > 0) {
    const index = duplicates[0];
    const key = index === undefined ? '' : (rows[index]?.key.trim() ?? '');
    return `“${key}” is listed more than once.`;
  }

  // A value with no key is the case worth naming, because it is the one that
  // vanishes on save with nothing on screen to explain where it went.
  const orphan = rows.some((row) => row.key.trim() === '' && row.value.trim() !== '');
  if (orphan) return 'Every value needs a key.';

  return undefined;
}

/** Rows in key order. Explicit, because the natural order is what was typed. */
export function sortRows(rows: readonly KeyValueRow[]): KeyValueRow[] {
  return [...rows].sort((a, b) => a.key.trim().localeCompare(b.key.trim(), undefined, { sensitivity: 'base' }));
}
