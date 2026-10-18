<script setup lang="ts" generic="TValue extends string | number">
/**
 * Multiple choice from a known list.
 *
 * Built on the SAME v0 compound as `Select`, with `multiple` set, rather than
 * as a separate control — so the keyboard model, the ARIA wiring and the CSS
 * anchor positioning are shared rather than reimplemented and left to drift.
 * The visible differences are the trigger (chips instead of one label) and the
 * options (a check column, and the menu stays open).
 *
 * THE CHIPS ARE SPANS, NOT BUTTONS. v0's Select.Activator renders a
 * <button role="combobox">, and a button inside a button is invalid markup that
 * browsers reparent — the inner control simply stops receiving clicks. So
 * removal happens by toggling in the menu, and the one affordance that must sit
 * in the field, Clear, is a sibling of the activator rather than a child.
 */
import { Select } from '@vuetify/v0/components';
import { computed, shallowRef, useId } from 'vue';
import Icon from './Icon.vue';
import FieldReadonly from './FieldReadonly.vue';
import type { SelectOption } from './Select.vue';
import { useFocusShortcutTarget } from '../composables/useFocusShortcutTarget';

const props = withDefaults(
  defineProps<{
    options: readonly SelectOption<TValue>[];
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Show the chosen values as chips, with no menu and no remove controls. */
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /**
     * @deprecated Paints nothing. An editable field is now just a field; the
     * treatment moved to `readonly`. Kept so consumers keep compiling.
     */
    editable?: boolean;
    /**
     * Chips to render before collapsing the rest into "+N more".
     *
     * A cap rather than wrapping without limit: a filter with nine things
     * chosen would otherwise grow the field tall enough to push the content
     * below it off the screen.
     */
    maxChips?: number;
    /**
     * Registers this field for Ctrl/Cmd+K and `/`. When several fields opt in,
     * the shortcut cycles them in document order.
     */
    focusShortcut?: boolean;
  }>(),
  { label: undefined, description: undefined, placeholder: 'Select…', size: 'md', maxChips: 3 },
);

const model = defineModel<TValue[]>({ default: () => [] });

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const rootRef = shallowRef<HTMLElement | null>(null);

useFocusShortcutTarget(() => props.focusShortcut === true, rootRef);

const selected = computed(() => props.options.filter((option) => model.value.includes(option.value)));
const chips = computed(() => selected.value.slice(0, props.maxChips));
const overflow = computed(() => Math.max(0, selected.value.length - props.maxChips));

function isSelected(value: TValue): boolean {
  return model.value.includes(value);
}

function clear() {
  model.value = [];
}

/**
 * Escape clears when the menu is closed and something is selected. An open
 * listbox owns Escape first. Clear is pointer-only (tabindex -1).
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || selected.value.length === 0 || props.disabled) return;
  const control = event.currentTarget as HTMLElement;
  if (control.querySelector('[aria-expanded="true"]')) return;
  event.preventDefault();
  clear();
}
</script>

<template>
  <div
    ref="rootRef"
    class="r-field r-multiselect"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <FieldReadonly v-if="readonly" :id="fieldId" :label="label">
      <span v-if="selected.length === 0" class="r-field__readonly-empty">&mdash;</span>
      <span v-else class="r-multiselect__chips">
        <span v-for="option in chips" :key="String(option.value)" class="r-multiselect__chip">
          {{ option.label }}
        </span>
        <span v-if="overflow > 0" class="r-multiselect__more">+{{ overflow }} more</span>
      </span>
    </FieldReadonly>

    <Select.Root v-else :id="fieldId" v-model="model" multiple :disabled="disabled">
      <div class="r-field__control r-multiselect__control" @keydown="onKeydown">
        <Select.Activator class="r-multiselect__trigger" :aria-describedby="description ? describedBy : undefined">
          <span v-if="selected.length === 0" class="r-select__value r-select__value--placeholder">
            {{ placeholder }}
          </span>
          <span v-else class="r-multiselect__chips">
            <span v-for="option in chips" :key="String(option.value)" class="r-multiselect__chip">
              {{ option.label }}
            </span>
            <span v-if="overflow > 0" class="r-multiselect__more">+{{ overflow }} more</span>
          </span>
          <Icon class="r-select__chevron" name="chevron-down" :size="14" />
        </Select.Activator>

        <!-- Outside the activator, for the button-in-button reason above. -->
        <button
          v-if="selected.length > 0 && !disabled"
          type="button"
          class="r-multiselect__clear"
          tabindex="-1"
          :aria-label="`Clear ${selected.length} selected`"
          @click="clear"
        >
          <Icon name="x" :size="14" />
        </button>
      </div>

      <Select.Content class="r-select__menu">
        <Select.Item
          v-for="option in options"
          :key="String(option.value)"
          class="r-select__option r-multiselect__option"
          :value="option.value"
          :disabled="option.disabled"
        >
          <!-- The box is always rendered, empty when unselected: swapping the
               icon in and out would shift every label sideways on toggle. -->
          <span class="r-multiselect__check" aria-hidden="true">
            <Icon v-if="isSelected(option.value)" name="check" :size="14" />
          </span>
          <slot name="option" :option="option">{{ option.label }}</slot>
        </Select.Item>
      </Select.Content>
    </Select.Root>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
/*
 * Height becomes a MINIMUM here. The sized rules give .r-field__control a fixed
 * height, which is right for one line of text and wrong for a row of chips —
 * the second row would simply overflow the box.
 */
.r-multiselect__control {
  height: auto;
  min-height: var(--r-field-h, 34px);
  padding-inline-end: var(--sp-1);
}

.r-field--sm .r-multiselect__control {
  --r-field-h: 28px;
}

.r-field--md .r-multiselect__control {
  --r-field-h: 34px;
}

.r-field--lg .r-multiselect__control {
  --r-field-h: 40px;
}

.r-multiselect__trigger {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-width: 0;
  padding: var(--sp-1) 0;
  border: 0;
  background: none;
  color: var(--fg-primary);
  font: inherit;
  font-family: var(--font-data);
  text-align: start;
  cursor: pointer;
}

.r-multiselect__trigger:focus-visible {
  /* The ring belongs on the bordered control, which is the visible field. */
  outline: none;
}

.r-multiselect__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  min-width: 0;
}

.r-multiselect__chip {
  padding: 0.05rem var(--sp-2);
  border: 1px solid var(--border-default);
  border-radius: var(--r-pill);
  background: var(--bg-surface-3);
  color: var(--fg-primary);
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.r-multiselect__more {
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.r-multiselect__clear {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: var(--sp-1);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-faint);
  cursor: pointer;
}

.r-multiselect__clear:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-multiselect__option {
  gap: var(--sp-2);
}

.r-multiselect__check {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--accent-ink);
}
</style>
