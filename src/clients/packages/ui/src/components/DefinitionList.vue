<script setup lang="ts" generic="TKey extends string">
/**
 * A grid of label/value pairs, for the parts of a record you read rather than
 * change.
 *
 * Takes an array rather than markup. The React counterpart takes children and
 * carries a warning that each item MUST render as a fragment — a wrapping
 * element makes the pair one grid cell and every column stops lining up, which
 * it calls "the single most likely thing for a future tidy-up to break". Vue
 * has the same failure mode and no way to warn about it, so the shape is not
 * offered: this renders its own `dt`/`dd` and the footgun does not exist.
 *
 * Custom markup for one value goes through the `value` scoped slot, which is
 * given the item — a badge, a link, a copy button — without giving callers a
 * way to introduce a wrapper around the pair.
 */
import { computed } from 'vue';

export interface DefinitionItem<TKey extends string = string> {
  /** Stable key, also the slot discriminator. */
  key: TKey;
  label: string;
  /**
   * The value. `null`, `undefined` and `''` all render the absent marker, so a
   * caller never has to decide what nothing looks like.
   */
  value?: string | number | null;
  /** Tabular figures in the data face — NMIs, references, amounts, dates. */
  mono?: boolean;
  /** Spans the full width of a two-column list — addresses, notes, lists. */
  wide?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: readonly DefinitionItem<TKey>[];
    /**
     * Pairs per row on a wide viewport; always one on a narrow one.
     * `2` is the dense default for a detail panel; `1` suits a narrow blade or
     * values long enough to wrap against each other.
     */
    columns?: 1 | 2;
  }>(),
  { columns: 2 },
);

/** Absent is `null`, `undefined` or the empty string. `0` and `false` are values. */
function isAbsent(value: DefinitionItem['value']): boolean {
  return value === null || value === undefined || value === '';
}

const rows = computed(() => props.items.map((item) => ({ ...item, absent: isAbsent(item.value) })));
</script>

<template>
  <dl class="r-dfl" :class="{ 'r-dfl--2': columns === 2 }">
    <template v-for="item in rows" :key="item.key">
      <dt class="r-dfl__term" :class="{ 'r-dfl__term--wide': item.wide }">{{ item.label }}</dt>
      <dd class="r-dfl__value" :class="{ 'r-dfl__value--mono': item.mono, 'r-dfl__value--wide': item.wide }">
        <slot name="value" :item="item">
          <!-- The em dash is the absent marker, titled so it is not a mystery
               glyph to a screen reader or a new operator. -->
          <span v-if="item.absent" class="r-dfl__absent" title="Not set">&mdash;</span>
          <template v-else>{{ item.value }}</template>
        </slot>
      </dd>
    </template>
  </dl>
</template>

<style>
.r-dfl {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--sp-5);
  row-gap: var(--sp-2);
  margin: 0;
  font-family: var(--font-ui);
}

/*
 * A viewport query, not a container query: a container query needs an ancestor
 * declaring `container-type`, and this renders inside blades, cards and pages
 * that do not. Matching the React counterpart's `sm:` breakpoint keeps the two
 * implementations honest with each other.
 *
 * In a blade narrow enough that two pairs would collide, pass `columns: 1`
 * rather than relying on the viewport — the blade is narrow, the window is not.
 */
@media (min-width: 640px) {
  .r-dfl--2 {
    grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
  }
}

.r-dfl__term {
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

.r-dfl__value {
  min-width: 0;
  margin: 0;
  color: var(--fg-primary);
  font-size: var(--fs-base);
  line-height: var(--lh-snug);
  overflow-wrap: break-word;
}

/* The data face for anything you would read digit by digit. */
.r-dfl__value--mono {
  font-family: var(--font-data);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
}

.r-dfl__absent {
  color: var(--fg-faint);
}

/* A wide pair restarts at the first column and runs to the end, so it cannot
   leave a half-row of dead space beside it. */
.r-dfl--2 .r-dfl__term--wide {
  grid-column-start: 1;
}

.r-dfl--2 .r-dfl__value--wide {
  grid-column: 2 / -1;
}
</style>
