<script setup lang="ts" generic="TValue extends string | number">
/**
 * A segmented control — PrimeVue's SelectButton and ToggleButton in one.
 *
 * Built on v0's Toggle.Group rather than Tabs, and the distinction is not
 * cosmetic: tabs switch which panel is shown and carry tab/tabpanel semantics,
 * whereas this sets a VALUE. Using tabs for a filter announces panels that do
 * not exist.
 */
import { Toggle } from '@vuetify/v0/components';
import Icon from './Icon.vue';

export interface ToggleOption<TValue> {
  value: TValue;
  label?: string;
  icon?: string;
  disabled?: boolean;
  /** Accessible name, required when the option is icon-only. */
  ariaLabel?: string;
}

withDefaults(
  defineProps<{
    options: readonly ToggleOption<TValue>[];
    /** Names the group for assistive tech. */
    label: string;
    /** Allows more than one selection — a filter rather than a mode. */
    multiple?: boolean;
    /** Prevents clearing the last selection. */
    mandatory?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);

const model = defineModel<TValue | TValue[] | undefined>();
</script>

<template>
  <Toggle.Group
    v-model="model"
    class="r-toggles"
    :class="`r-toggles--${size}`"
    :label="label"
    :multiple="multiple"
    :mandatory="mandatory"
    :disabled="disabled"
  >
    <Toggle.Root
      v-for="option in options"
      :key="String(option.value)"
      class="r-toggles__item"
      :value="option.value"
      :disabled="option.disabled"
      :aria-label="option.ariaLabel ?? (option.label ? undefined : String(option.value))"
    >
      <Icon v-if="option.icon" :name="option.icon" :size="14" />
      <span v-if="option.label">{{ option.label }}</span>
    </Toggle.Root>
  </Toggle.Group>
</template>

<style>
.r-toggles {
  display: inline-flex;
  /*
   * `inline-flex` governs how this box lays out its OWN children; it does not
   * stop the box being stretched as somebody else's flex or grid item. Dropped
   * into a flex column (the default `align-items: stretch`), the group ran the
   * full width of its container and drew a bordered track of empty space after
   * the last option — reading as a broken control rather than a compact one.
   *
   * Both declarations earn their place: align-self handles flex/grid parents,
   * width handles a block parent that would otherwise stretch it.
   */
  align-self: start;
  width: fit-content;
  overflow: hidden;
  border: 1px solid var(--border-input);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
}

.r-toggles__item {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  border: 0;
  /* A divider between segments, drawn on the leading edge of all but the
       first — so the group reads as one control rather than a row of buttons. */
  border-left: 1px solid var(--border-subtle);
  background: none;
  color: var(--fg-secondary);
  font-family: var(--font-ui);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.r-toggles__item:first-child {
  border-left: 0;
}

.r-toggles--sm .r-toggles__item {
  height: 26px;
  padding: 0 var(--sp-2);
  font-size: var(--fs-sm);
}

.r-toggles--md .r-toggles__item {
  height: 32px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-base);
}

.r-toggles__item:hover:not([aria-disabled='true']) {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

/* v0 sets aria-pressed on a toggle, so the styling reads the same fact the
     assistive tech does. */
.r-toggles__item[aria-pressed='true'] {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-toggles__item[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
