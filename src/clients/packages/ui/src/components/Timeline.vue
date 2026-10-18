<script setup lang="ts">
import Icon from './Icon.vue';

/*
 * Vertical activity feed: a rail of dots, one entry per event, newest first by
 * convention (the caller owns the order). Admitted because three surfaces in
 * the first consuming app hand-rolled the same list — version history rows,
 * secret slot history, recent-views MRU — and a second app's audit trail is
 * the same shape again.
 *
 * Two modes, decided per-list rather than per-item:
 * - `selectable` renders every entry as a button; clicking emits `select` and,
 *   when a v-model is bound, records the selection (version pickers).
 * - without it the entries are plain list items (read-only feeds).
 *
 * The title/meta/trailing trio is deliberately flat — a feed that needs more
 * per-entry structure than "what, when, who" should compose its own rows in
 * the #item slot instead of feeding a mega-item through props.
 */
export interface TimelineItem {
  id: string;
  /** Primary line — the event. */
  title: string;
  /** Secondary line, start-aligned — usually when (a relative age). */
  meta?: string;
  /** Secondary line, end-aligned — usually who. */
  trailing?: string;
  /** Marker icon; omit for a plain dot. */
  icon?: string;
  /** Tooltip; defaults to the title. */
  tooltip?: string;
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[];
    selectable?: boolean;
    /** Monospace titles — timestamps and identifiers, not prose. */
    mono?: boolean;
    /** Accessible name for the feed. */
    label?: string;
  }>(),
  { selectable: false, mono: false, label: 'Activity' },
);

/** The selected entry's id (selectable lists only). */
const selected = defineModel<string | null>({ default: null });

const emit = defineEmits<{ (e: 'select', id: string): void }>();

function activate(item: TimelineItem) {
  if (!props.selectable) return;
  selected.value = item.id;
  emit('select', item.id);
}
</script>

<template>
  <ul class="r-timeline" :aria-label="label">
    <li v-for="item in items" :key="item.id" class="r-timeline__entry">
      <span class="r-timeline__marker" aria-hidden="true">
        <Icon v-if="item.icon" :name="item.icon" :size="12" />
      </span>
      <component
        :is="selectable ? 'button' : 'div'"
        :type="selectable ? 'button' : undefined"
        class="r-timeline__item"
        :class="{
          'r-timeline__item--selectable': selectable,
          'r-timeline__item--selected': selectable && selected === item.id,
        }"
        :title="item.tooltip ?? item.title"
        :aria-pressed="selectable ? String(selected === item.id) : undefined"
        @click="activate(item)"
      >
        <slot name="item" :item="item">
          <span class="r-timeline__title" :class="{ 'r-timeline__title--mono': mono }">{{ item.title }}</span>
          <span v-if="item.meta || item.trailing" class="r-timeline__meta">
            <span v-if="item.meta">{{ item.meta }}</span>
            <span v-if="item.trailing" class="r-timeline__trailing">{{ item.trailing }}</span>
          </span>
        </slot>
      </component>
      <!-- Per-entry extras the feed itself doesn't model (a "here" tag, a
           per-row action). Outside the button so it stays clickable-separate. -->
      <slot name="item-end" :item="item" />
    </li>
  </ul>
</template>

<style>
.r-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  font-family: var(--font-ui);
}

.r-timeline__entry {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding-left: var(--sp-1);
}

/* The rail is drawn per-entry (a ::before segment under the marker) rather
   than as one border on the list, so it starts at the first dot and stops at
   the last instead of overhanging both ends. */
.r-timeline__entry::before {
  content: '';
  position: absolute;
  left: calc(var(--sp-1) + 8px);
  top: 20px;
  bottom: -4px;
  width: 1px;
  background: var(--border-default);
}

.r-timeline__entry:last-child::before {
  display: none;
}

.r-timeline__marker {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: var(--sp-2);
  border-radius: var(--r-pill);
  border: 1px solid var(--border-strong);
  background: var(--bg-surface);
  color: var(--fg-muted);
  z-index: 1;
}

/* Plain dot when no icon: shrink the ring to a filled point. */
.r-timeline__marker:empty {
  width: 7px;
  height: 7px;
  margin-left: 4px;
  margin-right: 5px;
  background: var(--border-strong);
  border: none;
}

.r-timeline__item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-2) var(--sp-2);
  margin-bottom: var(--sp-1);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
}

.r-timeline__item--selectable {
  cursor: pointer;
}

.r-timeline__item--selectable:hover {
  background: var(--bg-surface-3);
}

.r-timeline__item--selected,
.r-timeline__item--selectable.r-timeline__item--selected:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}

.r-timeline__title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--fg-primary);
  word-break: break-word;
}

.r-timeline__title--mono {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.r-timeline__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}

.r-timeline__trailing {
  font-style: italic;
  text-align: right;
}
</style>
