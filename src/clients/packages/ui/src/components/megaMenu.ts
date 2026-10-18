/**
 * Shapes and grid arithmetic for MegaMenu.
 *
 * The navigation maths lives here rather than in the SFC because jsdom has no
 * layout engine: a panel's columns are a DOM fact, but "where does ArrowRight
 * go from column 2 row 5 when column 3 is shorter" is arithmetic, and testing
 * it through mounted focus() calls tests jsdom instead of the rule.
 */
import type { RouteLocationRaw } from 'vue-router';

/** A leaf inside a panel column. */
export interface MegaMenuItem {
  /** Omit `label` and set `separator` for a divider. */
  label?: string;
  icon?: string;
  /** Navigates via RouterLink. Takes precedence over `href` and `action`. */
  to?: RouteLocationRaw;
  /** Navigates via a plain anchor (external links). */
  href?: string;
  action?: () => void;
  disabled?: boolean;
  /**
   * Marks the item as the current one.
   *
   * It is a prop rather than something derived from the route because callers
   * match on their own terms — a prefix match for a nested stack, an exact
   * match for a leaf — and a library that guesses gets one of them wrong.
   */
  active?: boolean;
  separator?: boolean;
}

/** A labelled run of items within one column. */
export interface MegaMenuGroup {
  /** Omit for an unlabelled run — the trigger already names the panel. */
  label?: string;
  items: readonly MegaMenuItem[];
}

/** A menubar entry: either a command/link, or a trigger for a panel. */
export interface MegaMenuEntry {
  label: string;
  icon?: string;
  to?: RouteLocationRaw;
  href?: string;
  action?: () => void;
  disabled?: boolean;
  active?: boolean;
  /**
   * Panel contents, outer array = columns. Omit (or leave empty) and the entry
   * is a plain menubar command with no panel.
   */
  columns?: readonly (readonly MegaMenuGroup[])[];
}

export type MegaMenuMove = 'up' | 'down' | 'left' | 'right' | 'first' | 'last';

/**
 * What up/down mean in a panel.
 *
 * `column` wraps inside the current column: right when the columns are real
 * labelled groups, where the bottom of "Positions" is the end of something.
 * `list` runs on into the next column: right when the columns are one list
 * reflowed for width, where the bottom of column 1 is the middle of the list
 * and wrapping back to its top skips half the items.
 *
 * `auto` reads that off the model — labels mean groups, no labels mean a list.
 */
export type MegaMenuFlow = 'auto' | 'column' | 'list';

export interface MegaMenuPosition {
  column: number;
  row: number;
}

/** True when the entry opens a panel rather than acting on its own. */
export function hasPanel(entry: MegaMenuEntry): boolean {
  return (entry.columns?.length ?? 0) > 0;
}

/**
 * Split a flat item list into single-group columns of at most `maxRows`.
 *
 * Callers with one long list (a section index, say) want the panel to fill
 * down and then across — the same shape `grid-auto-flow: column` gives — but
 * the DOM has to agree with the visual columns or ArrowLeft/ArrowRight land
 * somewhere the eye did not expect. Chunking here keeps the two the same fact.
 */
export function chunkColumns(items: readonly MegaMenuItem[], maxRows = 6): MegaMenuGroup[][] {
  if (items.length === 0) return [];
  const rows = Math.max(1, Math.min(maxRows, items.length));
  const columns: MegaMenuGroup[][] = [];
  for (let start = 0; start < items.length; start += rows) {
    columns.push([{ items: items.slice(start, start + rows) }]);
  }
  return columns;
}

/** True when any column in the entry carries a group label. */
export function hasGroupLabels(entry: MegaMenuEntry): boolean {
  return (entry.columns ?? []).some((column) => column.some((group) => Boolean(group.label)));
}

/** Resolve `auto` against the model: labelled columns are groups, bare ones a list. */
export function resolveFlow(entry: MegaMenuEntry, flow: MegaMenuFlow): 'column' | 'list' {
  if (flow !== 'auto') return flow;
  return hasGroupLabels(entry) ? 'column' : 'list';
}

/**
 * Next focus position in a panel, given the item count of each column.
 *
 * Left/right always move by column, skipping empty ones and clamping the row —
 * the target column may be shorter, and clamping keeps the caret on the nearest
 * real item instead of refusing to move.
 *
 * Up/down depend on `flow`: `column` wraps at the ends of the current column,
 * `list` carries on into the next one and wraps only at the ends of the panel.
 * See MegaMenuFlow for which suits which panel.
 */
export function moveInGrid(
  columns: readonly number[],
  from: MegaMenuPosition,
  move: MegaMenuMove,
  flow: 'column' | 'list' = 'column',
): MegaMenuPosition | null {
  const filled = columns.map((count, index) => ({ count, index })).filter((column) => column.count > 0);
  if (filled.length === 0) return null;

  const first = filled[0]!;
  const last = filled[filled.length - 1]!;
  if (move === 'first') return { column: first.index, row: 0 };
  if (move === 'last') return { column: last.index, row: last.count - 1 };

  // An out-of-range origin (nothing focused yet) enters at the first item.
  const atIndex = filled.findIndex((column) => column.index === from.column);
  if (atIndex === -1) return { column: first.index, row: 0 };

  const current = filled[atIndex]!;
  const row = Math.min(Math.max(from.row, 0), current.count - 1);

  if (move === 'up' || move === 'down') {
    const step = move === 'down' ? 1 : -1;
    if (flow === 'column') {
      return { column: current.index, row: (row + step + current.count) % current.count };
    }

    // Reading order: walk the columns as one sequence, wrapping only at the
    // panel's ends.
    const before = filled.slice(0, atIndex).reduce((sum, column) => sum + column.count, 0);
    const total = filled.reduce((sum, column) => sum + column.count, 0);
    let remaining = (before + row + step + total) % total;
    for (const column of filled) {
      if (remaining < column.count) return { column: column.index, row: remaining };
      remaining -= column.count;
    }
    return null;
  }

  const step = move === 'right' ? 1 : -1;
  const target = filled[(atIndex + step + filled.length) % filled.length]!;
  return { column: target.index, row: Math.min(row, target.count - 1) };
}

function enabledEntries(entries: readonly MegaMenuEntry[]): number[] {
  return entries.flatMap((entry, index) => (entry.disabled === true ? [] : [index]));
}

/** Wrapping step between menubar entries, skipping disabled ones. */
export function moveInBar(entries: readonly MegaMenuEntry[], from: number, step: number): number | null {
  const enabled = enabledEntries(entries);
  if (enabled.length === 0) return null;

  const atIndex = enabled.indexOf(from);
  if (atIndex === -1) return enabled[0]!;
  return enabled[(atIndex + step + enabled.length) % enabled.length]!;
}

/** First or last enabled entry — Home / End, which do not wrap. */
export function edgeInBar(entries: readonly MegaMenuEntry[], edge: 'first' | 'last'): number | null {
  const enabled = enabledEntries(entries);
  if (enabled.length === 0) return null;
  return edge === 'first' ? enabled[0]! : enabled[enabled.length - 1]!;
}
