<script setup lang="ts" generic="TValue extends string | number">
/**
 * Dropdown selection on v0's Select, which handles the listbox roles, virtual
 * focus and type-ahead.
 *
 * Deliberately NOT a native <select>. The values here are frequently
 * two-line (a service's display name plus its slug) and native option
 * elements cannot hold markup — that is the one thing a native select cannot
 * be talked into.
 */
import { Select } from '@vuetify/v0/components';
import { computed, shallowRef, useAttrs, useId } from 'vue';
import Icon from './Icon.vue';
import FieldReadonly from './FieldReadonly.vue';
import { useFocusShortcutTarget } from '../composables/useFocusShortcutTarget';

export interface SelectOption<TValue> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    options: readonly SelectOption<TValue>[];
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /**
     * Show the current selection as a value, not a control. The listbox is not
     * rendered at all — see FieldReadonly.
     */
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /**
     * @deprecated Paints nothing. An editable field is now just a field; the
     * treatment moved to `readonly`. Kept so consumers keep compiling.
     */
    editable?: boolean;
    /** Shows a clear control when a value is selected. Escape clears while focused (menu closed). */
    clearable?: boolean;
    /**
     * Registers this field for Ctrl/Cmd+K and `/`. When several fields opt in,
     * the shortcut cycles them in document order.
     */
    focusShortcut?: boolean;
  }>(),
  { label: undefined, description: undefined, placeholder: 'Select…', size: 'md' },
);

const model = defineModel<TValue | undefined>();
const attrs = useAttrs();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const rootRef = shallowRef<HTMLElement | null>(null);

useFocusShortcutTarget(() => props.focusShortcut === true, rootRef);

// v0 renders the trigger's text through Select.Value; this resolves the label
// for the current value so the trigger shows the display name rather than the
// raw key.
const selectedLabel = computed(() => props.options.find((option) => option.value === model.value)?.label);

const showClear = computed(
  () => props.clearable === true && model.value !== undefined && !props.disabled && !props.readonly,
);

function clear() {
  model.value = undefined;
}

/**
 * Escape clears only when the menu is closed — an open listbox owns Escape
 * first (v0 closes it). Clear button is pointer-only (tabindex -1).
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !showClear.value) return;
  const control = event.currentTarget as HTMLElement;
  if (control.querySelector('[aria-expanded="true"]')) return;
  event.preventDefault();
  clear();
}
</script>

<template>
  <div
    ref="rootRef"
    class="r-field"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <FieldReadonly v-if="readonly" :id="fieldId" :text="selectedLabel" />

    <Select.Root v-else :id="fieldId" v-model="model" :disabled="disabled">
      <!--
        Clear sits beside the activator, not inside it: Select.Activator is a
        <button>, and a button-in-button is invalid markup browsers reparent.
        Same pattern as MultiSelect — border on the wrapper, trigger bare.
      -->
      <div class="r-field__control r-select__control" @keydown="onKeydown">
        <Select.Activator
          class="r-select__trigger"
          :aria-describedby="description ? describedBy : undefined"
          v-bind="attrs"
        >
          <!-- Deliberately NOT Select.Value. That renders the selected item's own
               content from context and renders NOTHING when there is no selection,
               ignoring any fallback passed to it — so the placeholder never
               appeared and the trigger came out empty but for the chevron. The
               label is resolved here instead, where the empty case is handled. -->
          <span class="r-select__value" :class="{ 'r-select__value--placeholder': selectedLabel === undefined }">
            {{ selectedLabel ?? placeholder }}
          </span>
          <Icon class="r-select__chevron" name="chevron-down" :size="14" />
        </Select.Activator>

        <button
          v-if="showClear"
          type="button"
          class="r-select__clear"
          tabindex="-1"
          :aria-label="`Clear ${label ?? 'selection'}`"
          @click="clear"
        >
          <Icon name="x" :size="14" />
        </button>
      </div>

      <Select.Content class="r-select__menu">
        <Select.Item
          v-for="option in options"
          :key="String(option.value)"
          class="r-select__option"
          :value="option.value"
          :disabled="option.disabled"
        >
          <slot name="option" :option="option">{{ option.label }}</slot>
        </Select.Item>
      </Select.Content>
    </Select.Root>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
.r-select__control {
  padding-inline-end: var(--sp-1);
}

.r-select__trigger {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg-primary);
  font: inherit;
  font-family: var(--font-data);
  text-align: start;
  cursor: pointer;
}

.r-select__trigger:focus-visible {
  /* Ring belongs on the bordered control wrapper. */
  outline: none;
}

.r-select__value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Placeholder text is muted, matching an input's ::placeholder — otherwise
     "Select…" reads as a chosen value. */
.r-select__value--placeholder {
  color: var(--fg-faint);
}

.r-select__chevron {
  flex: none;
  color: var(--fg-faint);
}

.r-select__clear {
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

.r-select__clear:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

/*
   * v0 positions the popover with the CSS anchor API, so there is no JS
   * measurement to fight — this only has to say what it looks like.
   */
.r-select__menu {
  z-index: 50;
  min-width: anchor-size(width);
  max-height: 18rem;
  padding: var(--sp-1);
  overflow-y: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.r-select__option {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-2);
  border-radius: var(--r-xs);
  color: var(--fg-primary);
  font-size: var(--fs-base);
  cursor: pointer;
}

/* Virtual focus: v0 moves aria-activedescendant rather than real focus, so
     the highlight follows that attribute, not :hover or :focus. */
.r-select__option[data-highlighted],
.r-select__option:hover {
  background: var(--bg-surface-3);
}

.r-select__option[aria-selected='true'] {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-select__option[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
