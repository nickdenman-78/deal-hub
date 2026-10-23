<script setup lang="ts" generic="T extends object">
/**
 * The table, built on v0's createDataTable.
 *
 * v0 supplies the STATE — filter, sort, select, group — and none of
 * the markup; `DataTable` is on its "planned, not yet exported" list, so the
 * DOM below is ours either way. Pagination is intentionally NOT taken from
 * v0 here: the package's Pagination sits beside the table, and the caller
 * passes already-paged rows (see createDataTable `itemsPerPage` override).
 *
 * Two things about createDataTable are easy to get wrong, handled here once:
 *   - Rows live in a registry that must be fed imperatively, and that registry
 *     is explicitly NON-reactive. Iterating it in a template silently fails to
 *     update. Everything below reads `table.items`.
 *   - `groupBy` is read once at construction, so it cannot change over a
 *     component's life. Documented as such rather than quietly ignored.
 */
import { createDataTable, useElementSize } from '@vuetify/v0';
import { computed, nextTick, ref, shallowRef, useSlots, watch } from 'vue';
import Icon from '../components/Icon.vue';
import Spinner from '../components/Spinner.vue';
import { scrollRowIntoView } from './scrollRowIntoView';
import type { DataTableColumn, DataTableDensity, DataTableSort } from './types';

const props = withDefaults(
  defineProps<{
    rows: readonly T[];
    columns: readonly DataTableColumn<T>[];
    /**
     * Stable identity per row. Required: registry ids drive selection,
     * expansion and the active-row highlight, and an index would reshuffle
     * all three the moment the data sorts.
     */
    rowId: (row: T) => string | number;
    loading?: boolean;
    emptyText?: string;
    /** Accessible name for the table (caption / aria-label). */
    ariaLabel?: string;
    /**
     * Group rows under collapsible subheaders.
     *
     * Read ONCE when the table is created — v0 takes it as a construction
     * option, not a reactive one — so switching it at runtime does nothing.
     */
    groupBy?: keyof T & string;
    /** Open every group initially. Ignored without `groupBy`. */
    openGroupsInitially?: boolean;
    striped?: boolean;
    density?: DataTableDensity;
    /**
     * Makes rows activatable: click, Enter or Space emit `rowActivate`.
     * Returning a URL also makes ctrl/cmd/middle-click open a new tab.
     *
     * The table never navigates by itself — the caller decides. In a blade
     * stack that matters: the row must push a nested route rather than
     * replace the page.
     */
    rowHref?: (row: T) => string | undefined;
    /**
     * Marks the row whose record is currently open. It is highlighted, it
     * becomes the table's tab stop, and it is scrolled into view.
     *
     * Pass ONE predicate to both this and `rowHref`'s target so the two can
     * never disagree about which row is open.
     */
    rowActive?: (row: T) => boolean;
    /**
     * Extra class(es) per row, for state the table cannot know about — an
     * archived entity dimmed, a parent row weighted differently from its
     * children. Returns a class string, not a style: the colours belong in
     * the consuming view's stylesheet, not in a binding.
     */
    rowClass?: (row: T) => string | undefined;
    /**
     * Show visible labels on `.r-field` controls in `#filters`. Default is
     * omitted — keep passing `label` for a11y / clear-button copy; placeholders
     * carry the visual cue. Checkbox labels are always visible.
     */
    showFilterLabels?: boolean;
    /**
     * Leading checkbox column + select-all header, reported through
     * `v-model:selected` as row ids. Selection is kept HERE rather than in
     * v0's selectStrategy so ids of filtered-out rows survive a filter — a
     * bulk action must not silently shrink because the operator narrowed the
     * view after ticking.
     */
    selectable?: boolean;
    /**
     * Per-row disclosure: a leading chevron column toggles an extra full-width
     * row rendered from the `#expanded` slot. Open rows are `v-model:expanded`
     * (row ids), so a caller can persist or close them programmatically.
     */
    expandable?: boolean;
    /**
     * Which rows may be selected (`selectable` only). A row this rejects
     * renders a disabled checkbox and is skipped by select-all — a locked
     * entry must not become part of a bulk action just because the header
     * box was ticked.
     */
    rowSelectable?: (row: T) => boolean;
  }>(),
  {
    loading: false,
    emptyText: 'Nothing to show.',
    groupBy: undefined,
    density: 'standard',
    rowHref: undefined,
    rowActive: undefined,
    rowClass: undefined,
    showFilterLabels: false,
    selectable: false,
    expandable: false,
    rowSelectable: undefined,
  },
);

const emit = defineEmits<{ rowActivate: [row: T] }>();

defineSlots<{
  /** Per-column cell override, e.g. `#cell-name="{ row }"`. */
  [key: `cell-${string}`]: (props: { row: T; value: unknown }) => unknown;
  /** Full-width disclosure row under an expanded row (`expandable` only). */
  expanded?: (props: { row: T }) => unknown;
  /**
   * Sticky filter bar above the column headers. Free-form — controls do not
   * have to line up with columns. Any form control; the table only supplies
   * the chrome and sticky stacking. The caller owns values and how rows are
   * filtered.
   */
  filters?: () => unknown;
  'group-header'?: (props: { value: unknown; count: number }) => unknown;
  empty?: () => unknown;
}>();

const slots = useSlots();

/** Filter bar appears when the `#filters` slot is used. */
const hasFilters = computed(() => typeof slots.filters === 'function');

/** Free-text query across every `filterable` column. */
const search = defineModel<string>('search', { default: '' });

/**
 * Which groups are open, as group keys. Exposed as a model so the app owns
 * persistence — config-admin already persists this per view, and burying it
 * here would make that a private detail of the table.
 *
 * Deliberately has NO default. `undefined` means uncontrolled, and the table
 * keeps its own state seeded from `openGroupsInitially`. A default of `[]`
 * would be indistinguishable from "the consumer wants everything closed", so
 * the immediate sync below would slam every group shut and silently defeat
 * `openGroupsInitially`.
 */
const openGroups = defineModel<string[] | undefined>('openGroups', { default: undefined });

/** Selected row ids (`selectable` only). */
const selected = defineModel<Array<string | number>>('selected', { default: () => [] });

/** Expanded row ids (`expandable` only). */
const expanded = defineModel<Array<string | number>>('expanded', { default: () => [] });

/**
 * Single-column sort as a controlled model.
 *
 * `undefined` (default) leaves v0's own sort in charge — header clicks cycle
 * through v0's state and the client-side comparator runs. `null` or a
 * `{ id, direction }` value takes over: v0 is bypassed and the consumer is
 * responsible for reordering the rows, which is what a server-paged screen
 * has to do anyway (sorting one page is worse than not sorting at all,
 * because it looks right).
 */
const sort = defineModel<DataTableSort | undefined>('sort', { default: undefined });

const sortControlled = computed(() => sort.value !== undefined);

/*
 * v0 constrains its row type to `Record<string, unknown>`, which a plain
 * `interface` does not satisfy — interfaces get no implicit index signature,
 * so every consumer would have to declare its row type as a type alias or add
 * `[key: string]: unknown`. That is a real constraint to push onto callers for
 * no benefit, so the public generic here is `T extends object` and the
 * intersection is applied only where v0 sees it.
 */
type Row = T & Record<string, unknown>;

const table = createDataTable<Row>({
  groupBy: props.groupBy,
  openAll: props.openGroupsInitially === true,
  selectStrategy: 'page',
  /*
   * Pagination is deliberately OUTSIDE this component (see Pagination.vue):
   * the caller owns page state and passes only the current page's rows. v0's
   * createDataTable still paginates `items` with a default of 10, which would
   * silently truncate every page the caller already sliced. Keep itemsPerPage
   * at least the row count so `items` === sorted/filtered rows.
   */
  pagination: { itemsPerPage: () => Math.max(props.rows.length, 1) },
});

// ── Columns ───────────────────────────────────────────────────────────────
// Re-onboarded wholesale rather than diffed: column sets are small and change
// rarely, and v0 reconciles sort state against the live column list itself.
watch(
  () => props.columns,
  (columns) => {
    table.columns.clear();
    table.columns.onboard(
      columns.map((column) => ({
        id: column.id,
        title: column.header,
        // A column with no field has nothing for the pipeline to compare, so
        // it cannot honestly claim to be sortable or filterable.
        sortable: column.sortable === true && column.field !== undefined,
        filterable: column.filterable === true && column.field !== undefined,
        sort: column.sort,
      })),
    );
  },
  { immediate: true, deep: true },
);

// ── Rows ──────────────────────────────────────────────────────────────────
watch(
  () => props.rows,
  (rows) => {
    table.clear();
    table.onboard(rows.map((row) => ({ id: props.rowId(row), value: row as Row })));
  },
  { immediate: true },
);

watch(search, (value) => table.search(value), { immediate: true });

// ── Group open state, two-way ─────────────────────────────────────────────
// A guard on each side: applying the model re-triggers v0's state, which would
// otherwise emit straight back and ping-pong.
let syncing = false;

watch(
  openGroups,
  (keys) => {
    // undefined === uncontrolled: leave the table's own state alone.
    if (syncing || keys === undefined || props.groupBy === undefined) return;
    syncing = true;
    table.grouping.closeAll();
    for (const key of keys) table.grouping.open(key);
    syncing = false;
  },
  { immediate: true, deep: true },
);

watch(
  () => table.grouping.groups.value.filter((group) => table.grouping.isOpen(group.key)).map((group) => group.key),
  (keys) => {
    if (syncing) return;
    const current = openGroups.value;
    if (current !== undefined && keys.length === current.length && keys.every((key) => current.includes(key))) return;
    syncing = true;
    openGroups.value = keys;
    syncing = false;
  },
);

// ── Render model ──────────────────────────────────────────────────────────
/**
 * One flat list of what to render, group headers included.
 *
 * Flat rather than nested loops so a row's index is its position among ALL
 * visible rows. Roving focus, the tab stop and scroll-into-view all key off
 * that index, and per-group indices would make each of them wrong the moment
 * a group above collapsed.
 */
type RenderItem =
  { kind: 'group'; key: string; value: unknown; count: number; open: boolean } | { kind: 'row'; row: T; index: number };

const renderItems = computed<RenderItem[]>(() => {
  if (props.groupBy === undefined) {
    return table.items.value.map((row, index) => ({ kind: 'row', row, index }));
  }

  const out: RenderItem[] = [];
  let index = 0;
  for (const group of table.grouping.groups.value) {
    const open = table.grouping.isOpen(group.key);
    out.push({ kind: 'group', key: group.key, value: group.value, count: group.items.length, open });
    if (!open) continue;
    for (const row of group.items) out.push({ kind: 'row', row, index: index++ });
  }
  return out;
});

/** Every row currently on screen, in visual order. */
const visibleRows = computed(() =>
  renderItems.value.filter((item): item is Extract<RenderItem, { kind: 'row' }> => item.kind === 'row'),
);

const isEmpty = computed(() => !props.loading && table.items.value.length === 0);

// ── Selection ─────────────────────────────────────────────────────────────
const selectedIds = computed<ReadonlySet<string | number>>(() => new Set(selected.value));

function isSelected(row: T): boolean {
  return selectedIds.value.has(props.rowId(row));
}

function toggleSelected(row: T) {
  const id = props.rowId(row);
  selected.value = isSelected(row) ? selected.value.filter((s) => s !== id) : [...selected.value, id];
}

function canSelect(row: T): boolean {
  return props.rowSelectable?.(row) !== false;
}

/*
 * The header checkbox works on the VISIBLE, SELECTABLE rows only (what the
 * operator can see and act on is what "all" means), but never touches
 * selections of rows a filter has hidden — those were deliberate and come
 * back with the rows.
 */
const selectableVisible = computed(() => visibleRows.value.filter((item) => canSelect(item.row)));

const allVisibleSelected = computed(
  () => selectableVisible.value.length > 0 && selectableVisible.value.every((item) => isSelected(item.row)),
);
const someVisibleSelected = computed(
  () => !allVisibleSelected.value && selectableVisible.value.some((item) => isSelected(item.row)),
);

function toggleAllVisible() {
  const visibleIds = selectableVisible.value.map((item) => props.rowId(item.row));
  if (allVisibleSelected.value) {
    const drop = new Set(visibleIds);
    selected.value = selected.value.filter((id) => !drop.has(id));
  } else {
    const have = selectedIds.value;
    selected.value = [...selected.value, ...visibleIds.filter((id) => !have.has(id))];
  }
}

// ── Expansion ─────────────────────────────────────────────────────────────
const expandedIds = computed<ReadonlySet<string | number>>(() => new Set(expanded.value));

function isExpanded(row: T): boolean {
  return expandedIds.value.has(props.rowId(row));
}

function toggleExpanded(row: T) {
  const id = props.rowId(row);
  expanded.value = isExpanded(row) ? expanded.value.filter((e) => e !== id) : [...expanded.value, id];
}

/* Control columns sit before the data columns; every full-width row (filters,
 * states, group headers, expansions) must span them too. */
const totalColumns = computed(() => props.columns.length + (props.selectable ? 1 : 0) + (props.expandable ? 1 : 0));

function cellValue(row: T, column: DataTableColumn<T>): unknown {
  return column.field === undefined ? undefined : row[column.field];
}

function directionOf(id: string): 'asc' | 'desc' | undefined {
  if (sortControlled.value) {
    const value = sort.value;
    return value && value.id === id ? value.direction : undefined;
  }
  const raw = table.sort.direction(id);
  return raw === 'asc' || raw === 'desc' ? raw : undefined;
}

function sortIcon(id: string): string {
  const direction = directionOf(id);
  if (direction === 'asc') return 'arrow-up';
  if (direction === 'desc') return 'arrow-down';
  return 'arrow-up-down';
}

function ariaSort(id: string): 'ascending' | 'descending' | 'none' {
  const direction = directionOf(id);
  if (direction === 'asc') return 'ascending';
  if (direction === 'desc') return 'descending';
  return 'none';
}

/**
 * A sortable column shows a button when it has a `field` for the built-in
 * pipeline OR when the caller is driving the sort themselves (server-side).
 * Server-sortable columns don't need `field` — the id alone is enough for the
 * caller to translate to whatever ordering key their query uses.
 */
function isSortButtonVisible(column: DataTableColumn<T>): boolean {
  if (column.sortable !== true) return false;
  return column.field !== undefined || sortControlled.value;
}

/** Cycle asc → desc → null, matching v0's toggle for the controlled path. */
function toggleControlledSort(id: string): void {
  const current = sort.value;
  if (!current || current.id !== id) {
    sort.value = { id, direction: 'asc' };
    return;
  }
  if (current.direction === 'asc') {
    sort.value = { id, direction: 'desc' };
    return;
  }
  sort.value = null;
}

function onHeaderSort(id: string): void {
  if (sortControlled.value) {
    toggleControlledSort(id);
    return;
  }
  table.sort.toggle(id);
}

// ── Row activation ────────────────────────────────────────────────────────
const rowsActivate = computed(() => props.rowHref !== undefined);

function isActive(row: T): boolean {
  return props.rowActive?.(row) === true;
}

function onRowClick(row: T, event: MouseEvent) {
  if (!rowsActivate.value) return;
  // Let a real control inside the row win — a click on an inline action must
  // not also open the row.
  if ((event.target as HTMLElement).closest('a, button, input, select, textarea')) return;

  const href = props.rowHref?.(row);
  // Modified clicks mean "somewhere else", and the browser cannot do that for
  // a <tr>. Honour it explicitly rather than swallowing the intent.
  if (href !== undefined && (event.ctrlKey || event.metaKey || event.button === 1)) {
    window.open(href, '_blank', 'noopener');
    return;
  }
  emit('rowActivate', row);
}

// ── Roving tabindex ───────────────────────────────────────────────────────
// The table is ONE tab stop, not one per row, so Tab does not have to walk
// hundreds of rows to reach whatever follows it.
const tableRef = shallowRef<HTMLElement | null>(null);
const filterRowRef = shallowRef<HTMLElement | null>(null);
const headerRowRef = shallowRef<HTMLElement | null>(null);
const focusedIndex = ref(0);

/*
 * Sticky stacking needs EXACT thead row heights. A CSS approx leaves a gap
 * (body rows show through between filter and header while scrolling) or an
 * overlap. Measure the live rows and publish the vars the sticky `top`s read.
 * ceil avoids a sub-pixel slit on fractional layout.
 */
const { height: measuredFilterHeight } = useElementSize(filterRowRef);
const { height: measuredHeaderHeight } = useElementSize(headerRowRef);

const tableStyle = computed(() => {
  const style: Record<string, string> = {};
  if (hasFilters.value && measuredFilterHeight.value > 0) {
    style['--r-table-filter-height'] = `${Math.ceil(measuredFilterHeight.value)}px`;
  }
  if (measuredHeaderHeight.value > 0) {
    style['--r-table-head-height'] = `${Math.ceil(measuredHeaderHeight.value)}px`;
  }
  return style;
});

const activeIndex = computed(() => visibleRows.value.findIndex((item) => isActive(item.row)));

const tabStopIndex = computed(() => {
  // Prefer the open record, so tabbing back into a list returns you to where
  // you were rather than to the top.
  if (activeIndex.value !== -1) return activeIndex.value;
  return Math.min(focusedIndex.value, Math.max(0, visibleRows.value.length - 1));
});

function rowElements(): HTMLElement[] {
  return [...(tableRef.value?.querySelectorAll<HTMLElement>('tr[data-row]') ?? [])];
}

function focusRow(index: number) {
  const row = rowElements()[index];
  if (!row) return;
  focusedIndex.value = index;
  row.focus();
}

function onRowKeydown(row: T, index: number, event: KeyboardEvent) {
  if (!rowsActivate.value) return;
  const last = visibleRows.value.length - 1;

  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      emit('rowActivate', row);
      break;
    case 'ArrowDown':
      event.preventDefault();
      focusRow(Math.min(index + 1, last));
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusRow(Math.max(index - 1, 0));
      break;
    case 'Home':
      event.preventDefault();
      focusRow(0);
      break;
    case 'End':
      event.preventDefault();
      focusRow(last);
      break;
  }
}

// Bring the open row into view — vertically only, and only when it is
// actually off-screen. See scrollRowIntoView for why not scrollIntoView().
watch(
  activeIndex,
  async (index) => {
    if (index === -1) return;
    await nextTick();
    const row = rowElements()[index];
    if (row) scrollRowIntoView(row);
  },
  { flush: 'post' },
);

defineExpose({ table });
</script>

<template>
  <div class="r-table-wrap">
    <!--
      Without column filters the whole table can yield to a centred empty/loading
      state. With filters the thead must stay mounted — otherwise clearing a
      filter that emptied the list would also remove the controls that clear it.
    -->
    <div v-if="loading && !hasFilters" class="r-table__state">
      <Spinner centered label="Loading rows" />
    </div>

    <div v-else-if="isEmpty && !hasFilters" class="r-table__state">
      <slot name="empty">{{ emptyText }}</slot>
    </div>

    <table
      v-else
      ref="tableRef"
      class="r-table"
      :class="[
        `r-table--${density}`,
        {
          'r-table--striped': striped,
          'r-table--activatable': rowsActivate,
          'r-table--has-filters': hasFilters,
        },
      ]"
      :style="tableStyle"
      :aria-label="ariaLabel"
      :aria-rowcount="table.total.value"
    >
      <colgroup>
        <col v-if="selectable" class="r-table__col-control" />
        <col v-if="expandable" class="r-table__col-control" />
        <col v-for="column in columns" :key="column.id" :style="column.width ? { width: column.width } : undefined" />
      </colgroup>

      <thead>
        <!-- Free-form filter bar above column headers; sticks with them. -->
        <tr
          v-if="hasFilters"
          ref="filterRowRef"
          class="r-table__filters"
          :class="{ 'r-table__filters--show-labels': showFilterLabels }"
        >
          <th :colspan="totalColumns" scope="colgroup">
            <div class="r-table__filters-bar">
              <slot name="filters" />
            </div>
          </th>
        </tr>

        <tr ref="headerRowRef">
          <th v-if="selectable" scope="col" class="r-table__control-head">
            <!-- .prop: indeterminate is a DOM property, not an attribute — an
                 attribute binding would silently never show the mixed state. -->
            <input
              type="checkbox"
              class="r-table__checkbox"
              :checked="allVisibleSelected"
              :indeterminate.prop="someVisibleSelected"
              aria-label="Select all visible rows"
              @change="toggleAllVisible"
            />
          </th>
          <th v-if="expandable" scope="col" class="r-table__control-head" aria-label="Row details"></th>
          <th
            v-for="column in columns"
            :key="column.id"
            scope="col"
            :class="[`is-${column.align ?? 'start'}`]"
            :aria-sort="isSortButtonVisible(column) ? ariaSort(column.id) : undefined"
          >
            <!-- A real <button> inside the <th>, not a click handler on the th:
                 sorting is an action, and it has to be reachable by keyboard. -->
            <button
              v-if="isSortButtonVisible(column)"
              type="button"
              class="r-table__sort"
              @click="onHeaderSort(column.id)"
            >
              <span>{{ column.header }}</span>
              <Icon :name="sortIcon(column.id)" :size="12" />
            </button>
            <span v-else>{{ column.header }}</span>
          </th>
        </tr>
      </thead>

      <!-- One tbody, one flat list. Group subheaders are ordinary rows spanning
           every column, so a group collapses by simply not emitting its rows —
           no colspan arithmetic, which is exactly the hack PrimeVue's row-group
           mode needed a `pt` override to work around. -->
      <tbody>
        <tr v-if="loading" class="r-table__state-row">
          <td :colspan="totalColumns">
            <Spinner centered label="Loading rows" />
          </td>
        </tr>

        <tr v-else-if="isEmpty" class="r-table__state-row">
          <td :colspan="totalColumns">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>

        <template v-else>
          <template
            v-for="item in renderItems"
            :key="item.kind === 'group' ? `g:${item.key}` : String(rowId(item.row))"
          >
            <tr v-if="item.kind === 'group'" class="r-table__group-header">
              <th :colspan="totalColumns" scope="colgroup">
                <button
                  type="button"
                  class="r-table__group-toggle"
                  :aria-expanded="item.open"
                  @click="table.grouping.toggle(item.key)"
                >
                  <Icon :name="item.open ? 'chevron-down' : 'chevron-right'" :size="14" />
                  <slot name="group-header" :value="item.value" :count="item.count">
                    <span>{{ item.value }}</span>
                  </slot>
                  <span class="r-table__group-count">{{ item.count }}</span>
                </button>
              </th>
            </tr>

            <template v-else>
              <tr
                data-row
                :class="[
                  rowClass?.(item.row),
                  { 'is-active': isActive(item.row), 'is-selected': selectable && isSelected(item.row) },
                ]"
                :tabindex="rowsActivate ? (item.index === tabStopIndex ? 0 : -1) : undefined"
                @click="onRowClick(item.row, $event)"
                @auxclick="onRowClick(item.row, $event)"
                @keydown="onRowKeydown(item.row, item.index, $event)"
              >
                <!-- Real controls, so onRowClick's closest() guard keeps a tick
                     or a chevron from also activating the row. -->
                <td v-if="selectable" class="r-table__control-cell">
                  <input
                    type="checkbox"
                    class="r-table__checkbox"
                    :checked="isSelected(item.row)"
                    :disabled="!canSelect(item.row)"
                    :aria-label="`Select row ${rowId(item.row)}`"
                    @change="toggleSelected(item.row)"
                  />
                </td>
                <td v-if="expandable" class="r-table__control-cell">
                  <button
                    type="button"
                    class="r-table__expand"
                    :aria-expanded="isExpanded(item.row)"
                    :aria-label="`${isExpanded(item.row) ? 'Collapse' : 'Expand'} row ${rowId(item.row)}`"
                    @click="toggleExpanded(item.row)"
                  >
                    <Icon :name="isExpanded(item.row) ? 'chevron-down' : 'chevron-right'" :size="14" />
                  </button>
                </td>
                <td v-for="column in columns" :key="column.id" :class="`is-${column.align ?? 'start'}`">
                  <slot :name="`cell-${column.id}`" :row="item.row" :value="cellValue(item.row, column)">
                    {{ cellValue(item.row, column) }}
                  </slot>
                </td>
              </tr>
              <!-- The disclosure is its own row so a collapsed table has no
                   hidden DOM, and colspan keeps it clear of the sort layout. -->
              <tr v-if="expandable && isExpanded(item.row)" class="r-table__expansion">
                <td :colspan="totalColumns">
                  <slot name="expanded" :row="item.row" />
                </td>
              </tr>
            </template>
          </template>
        </template>
      </tbody>
    </table>
  </div>
</template>
