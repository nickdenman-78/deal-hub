<script setup lang="ts">
/**
 * Accordion root on v0's ExpansionPanel.Group. Pair with AccordionItem.
 *
 * Compound rather than an `items` array — panel bodies in product screens hold
 * forms and editors, and an array API would force all of that through a slot
 * keyed by index.
 *
 * `orientation` is ours alone: ExpansionPanel has no axis prop. Vertical stacks
 * panels (classic accordion); horizontal lays them edge-to-edge with sideways
 * headers. Open-state still comes from Group (`multiple` / `mandatory` / v-model).
 *
 * Group is `renderless` so our wrapper is the flex container — Atom would
 * otherwise sit between `.r-accordion` and the items and break orientation
 * layout the same way Tabs.Root's fragment forced a wrapper there.
 */
import { ExpansionPanel } from '@vuetify/v0/components';

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical';
    /**
     * Visual chrome. `default` is the bordered panel with tinted headers;
     * `plain` drops the outer frame and header fill so nested lists (e.g.
     * Services categories) read like the Groups/Secrets list pages.
     */
    variant?: 'default' | 'plain';
    /** Allow more than one panel open. Changes v-model from T to T[]. */
    multiple?: boolean;
    /**
     * - false: every panel may close
     * - true: the last open panel cannot be collapsed
     * - 'force': auto-open the first enabled panel
     */
    mandatory?: boolean | 'force';
    disabled?: boolean;
  }>(),
  { orientation: 'vertical', variant: 'default' },
);

const model = defineModel<string | number | Array<string | number> | undefined>();
</script>

<template>
  <div class="r-accordion" :class="[`r-accordion--${orientation}`, `r-accordion--${variant}`]">
    <ExpansionPanel.Group v-model="model" renderless :multiple="multiple" :mandatory="mandatory" :disabled="disabled">
      <slot />
    </ExpansionPanel.Group>
  </div>
</template>

<style>
.r-accordion {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  overflow: hidden;
}

.r-accordion--plain {
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.r-accordion--horizontal {
  flex-direction: row;
  align-items: stretch;
  /*
   * Horizontal panels need a definite block size or collapsed columns shrink
   * to the header strip and the open content has nowhere to grow.
   */
  min-height: 12rem;
}

.r-accordion__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-bottom: 1px solid var(--border-default);
}

.r-accordion__item:last-child {
  border-bottom: 0;
}

.r-accordion--plain .r-accordion__item {
  border-bottom: 0;
}

.r-accordion--horizontal .r-accordion__item {
  flex: none;
  flex-direction: row;
  border-right: 1px solid var(--border-default);
  border-bottom: 0;
}

.r-accordion--horizontal .r-accordion__item:last-child {
  border-right: 0;
}

/* Open column claims remaining width; closed ones stay header-only. */
.r-accordion--horizontal .r-accordion__item[data-selected] {
  flex: 1 1 auto;
}

.r-accordion__header {
  margin: 0;
  flex: none;
}

.r-accordion__trigger {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  border: 0;
  background: var(--bg-surface-2);
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  font-weight: var(--fw-medium);
  text-align: start;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.r-accordion__trigger:hover:not([disabled]):not([aria-disabled='true']) {
  background: var(--bg-surface-3);
}

.r-accordion__trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.r-accordion__trigger[disabled],
.r-accordion__trigger[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-accordion__trigger[aria-expanded='true'] {
  color: var(--accent-ink);
  background: var(--accent-soft);
}

/* Unframed headers that sit above list rows — no fill, no open tint. */
.r-accordion--plain .r-accordion__trigger {
  padding: var(--sp-2) 0;
  background: transparent;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.r-accordion--plain .r-accordion__trigger:hover:not([disabled]):not([aria-disabled='true']) {
  background: transparent;
  color: var(--fg-primary);
}

.r-accordion--plain .r-accordion__trigger[aria-expanded='true'] {
  color: var(--fg-primary);
  background: transparent;
}

.r-accordion__cue {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  color: var(--fg-muted);
}

.r-accordion__cue .r-icon {
  transition: transform var(--dur-fast) var(--ease-out);
}

/* Cue carries data-state from ExpansionPanel.Cue — same fact as aria-expanded. */
.r-accordion__cue[data-state='open'] .r-icon {
  transform: rotate(180deg);
}

.r-accordion__title {
  flex: 1;
  min-width: 0;
}

.r-accordion__content {
  padding: var(--sp-4);
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
}

.r-accordion--plain .r-accordion__content {
  /* Align nested BladeLink rows with sibling list pages (Groups / Secrets). */
  padding: 0 0 var(--sp-3);
}

.r-accordion__content[hidden] {
  display: none;
}

/* --- horizontal: sideways header strip beside growing content ------------- */

.r-accordion--horizontal .r-accordion__header {
  align-self: stretch;
}

.r-accordion--horizontal .r-accordion__trigger {
  flex-direction: column;
  justify-content: flex-start;
  gap: var(--sp-3);
  width: auto;
  height: 100%;
  padding: var(--sp-3) var(--sp-2);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}

.r-accordion--horizontal .r-accordion__cue {
  /* Undo the trigger's 180° so the chevron still reads along the strip. */
  transform: rotate(180deg);
}

.r-accordion--horizontal .r-accordion__cue .r-icon {
  /* Closed → point into the content column (visual "right" after rotations). */
  transform: rotate(90deg);
}

.r-accordion--horizontal .r-accordion__cue[data-state='open'] .r-icon {
  transform: rotate(180deg);
}

.r-accordion--horizontal .r-accordion__content {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
}
</style>
