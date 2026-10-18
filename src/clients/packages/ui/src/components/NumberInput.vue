<script setup lang="ts">
/**
 * Numeric amount field with optional unit chrome.
 *
 * Prefix / suffix are display-only (not part of the model): `$ 1,234.45`,
 * `1,000 certs`, `$178.45 /MW`.
 *
 * `v-model` is always the raw amount — digits, optional minus, and `.` only
 * (e.g. `1234.50`). Grouping separators exist only in the visible field while
 * resting. A local draft holds keystrokes while focused so formatting cannot
 * shove the caret past the decimal.
 */
import { Input } from '@vuetify/v0/components';
import { computed, nextTick, ref, useId, watch } from 'vue';
import type { InputSize } from './Input.vue';
import { formatCurrency, maskCurrency, rawCurrency, unformatCurrency } from './mask';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    editable?: boolean;
    /** Shown before the value, e.g. `$`. */
    prefixUnit?: string;
    /** Shown after the value, e.g. `certs` or `/MW`. */
    suffixUnit?: string;
    /** Digits after the decimal on blur / in the raw model. Default 2. */
    fractionDigits?: number;
    /** `toLocaleString` locale for display grouping only. */
    locale?: string;
    /** Allow a leading minus while editing. Default true. */
    allowNegative?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: undefined,
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
    prefixUnit: undefined,
    suffixUnit: undefined,
    fractionDigits: 2,
    locale: undefined,
    allowNegative: true,
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const focused = ref(false);
const root = ref<HTMLElement>();
/** What the <input> shows. Draft while focused; grouped display when resting. */
const text = ref('');

const formatOpts = computed(() => ({
  fractionDigits: props.fractionDigits,
  locale: props.locale,
  allowNegative: props.allowNegative,
}));

function denormalise(raw: string): string {
  return unformatCurrency(raw, formatOpts.value);
}

function displayOf(raw: string): string {
  return formatCurrency(raw, formatOpts.value);
}

function rawOf(raw: string): string {
  return rawCurrency(raw, formatOpts.value);
}

function selectEditValue() {
  const el = root.value?.querySelector('input');
  if (!(el instanceof HTMLInputElement)) return;
  el.select();
}

function onFocusIn() {
  focused.value = true;
  text.value = denormalise(model.value ?? text.value);
  void nextTick(selectEditValue);
}

function onFocusOut() {
  focused.value = false;
  const draft = text.value.trim();
  if (draft === '' || draft === '-' || draft === '.' || draft === '-.') {
    text.value = '';
    model.value = undefined;
    return;
  }
  const raw = rawOf(draft);
  model.value = raw === '' ? undefined : raw;
  text.value = displayOf(raw);
}

function onUpdate(value: string | undefined) {
  // Digits, one period, optional leading minus. Commas/spaces from a paste
  // are stripped. Model stays raw — never write grouping tokens into v-model.
  const next = maskCurrency(value ?? '', formatOpts.value);
  text.value = next;
  model.value = next === '' ? undefined : next;
}

/*
 * External / resting model is raw → refresh display only. Never push the
 * grouped display string back into v-model.
 */
watch(
  () => model.value,
  (value) => {
    if (focused.value) return;
    if (value === undefined || value === '') {
      text.value = '';
      return;
    }
    text.value = displayOf(value);
  },
  { immediate: true },
);

watch(
  () => [props.fractionDigits, props.locale, props.allowNegative] as const,
  () => {
    if (focused.value || model.value === undefined || model.value === '') return;
    const raw = rawOf(model.value);
    if (raw !== model.value) model.value = raw === '' ? undefined : raw;
    text.value = displayOf(model.value ?? '');
  },
);
</script>

<template>
  <div ref="root" @focusin="onFocusIn" @focusout="onFocusOut">
    <Input.Root
      :id="fieldId"
      :model-value="text"
      class="r-field"
      :class="[
        `r-field--${size}`,
        { 'r-field--editable': editable && !readonly, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
      ]"
      :label="label"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rules="rules"
      :error="error"
      :error-messages="errorMessages"
      @update:model-value="onUpdate"
    >
      <label v-if="label" class="r-field__label" :for="fieldId">
        {{ label }}
        <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
      </label>

      <div class="r-field__control">
        <span v-if="prefixUnit" class="r-field__affix" aria-hidden="true">{{ prefixUnit }}</span>
        <Input.Control class="r-field__input" type="text" inputmode="decimal" :placeholder="placeholder" />
        <span v-if="suffixUnit" class="r-field__affix" aria-hidden="true">{{ suffixUnit }}</span>
      </div>

      <Input.Description v-if="description" class="r-field__hint">{{ description }}</Input.Description>

      <Input.Error v-slot="{ errors }" class="r-field__error">
        <span v-for="message in errors" :key="message">{{ message }}</span>
      </Input.Error>
    </Input.Root>
  </div>
</template>
