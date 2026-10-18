<script setup lang="ts">
/**
 * Australian Business / Company Number field.
 *
 * `kind="abn"` (default): 11 digits, ABR modulus-89.
 * `kind="acn"`: 9 digits, ASIC check digit.
 *
 * `v-model` is digits only. Grouped display (`XX XXX XXX XXX` / `XXX XXX XXX`)
 * is applied when the overall control loses focus. Spaces from typing/paste are
 * stripped. With `kindSelector`, a paste of 9 or 11 digits flips kind.
 *
 * Checksum rules run when the overall control loses focus — not when focus
 * merely moves between the text input and the kind buttons.
 */
import { Input } from '@vuetify/v0/components';
import { computed, nextTick, ref, useId, watch } from 'vue';
import type { InputSize } from './Input.vue';
import { abnProblem, maskAbn } from './abn';
import { acnProblem, maskAcn } from './acn';
import { detectAbnAcnKind, digitsOnly, maxDigitsForKind, type AbnAcnKind } from './abnAcn';

export type { AbnAcnKind };

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    /** Overrides the default checksum rule for the active `kind` when provided. */
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    editable?: boolean;
    /**
     * Show an ABN | ACN selector at the end of the field. Off by default —
     * lock the type with `kind` / `v-model:kind` instead.
     */
    kindSelector?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: undefined,
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
    kindSelector: false,
  },
);

const model = defineModel<string | undefined>();
const kind = defineModel<AbnAcnKind>('kind', { default: 'abn' });

const fieldId = useId();
const root = ref<HTMLElement>();
const focused = ref(false);
/** Digits while focused; grouped when resting. Model is always digits. */
const text = ref('');

const isAcn = computed(() => kind.value === 'acn');
/*
 * One stable rule function (not rebuilt when `kind` flips). v0's InputRoot
 * onboards `rules` once at setup — a kind-swapped array would never replace
 * the registered checksum. Reading `kind` at validate-time keeps ABN↔ACN
 * switches honest.
 */
function defaultChecksumRule(value: unknown): true | string {
  if (typeof value !== 'string') return true;
  return (kind.value === 'acn' ? acnProblem(value) : abnProblem(value)) ?? true;
}
const effectiveRules = computed(() => props.rules ?? [defaultChecksumRule]);
const effectivePlaceholder = computed(() => props.placeholder ?? (isAcn.value ? 'XXX XXX XXX' : 'XX XXX XXX XXX'));

const blurErrors = ref<string[]>([]);
const mergedErrorMessages = computed(() => {
  const external = props.errorMessages;
  const fromProps = external === undefined ? [] : Array.isArray(external) ? external : [external];
  return [...fromProps, ...blurErrors.value];
});

function displayOf(raw: string): string {
  return kind.value === 'acn' ? maskAcn(raw) : maskAbn(raw);
}

function commitDigits(digits: string) {
  model.value = digits === '' ? undefined : digits;
  text.value = digits === '' ? '' : focused.value ? digits : displayOf(digits);
}

function restoreCaret(digitIndex: number) {
  void nextTick(() => {
    const input = root.value?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return;
    if (input.value !== text.value) input.value = text.value;
    const pos = Math.min(Math.max(digitIndex, 0), text.value.length);
    input.setSelectionRange(pos, pos);
  });
}

function onUpdate(value: string | undefined) {
  const input = root.value?.querySelector('input');
  const caret = input instanceof HTMLInputElement ? (input.selectionStart ?? 0) : 0;
  const incoming = value ?? '';
  const digitsBeforeCaret = digitsOnly(incoming.slice(0, caret), 32).length;
  const digits = digitsOnly(incoming, maxDigitsForKind(kind.value));

  text.value = digits;
  model.value = digits === '' ? undefined : digits;
  if (focused.value) restoreCaret(digitsBeforeCaret);
}

function setKind(next: AbnAcnKind) {
  if (props.disabled || props.readonly || kind.value === next) return;
  kind.value = next;
}

function runChecksumValidation() {
  const messages: string[] = [];
  for (const rule of effectiveRules.value) {
    const result = rule(model.value);
    if (typeof result === 'string') messages.push(result);
  }
  blurErrors.value = messages;
}

function onFocusIn() {
  if (focused.value) return;
  focused.value = true;
  text.value = digitsOnly(model.value ?? text.value, maxDigitsForKind(kind.value));
}

function onControlFocusOut(event: FocusEvent) {
  const el = root.value;
  const next = event.relatedTarget;
  if (el && next instanceof Node && el.contains(next)) return;

  focused.value = false;
  commitDigits(digitsOnly(text.value, maxDigitsForKind(kind.value)));
  runChecksumValidation();
}

function onPaste(event: ClipboardEvent) {
  if (!props.kindSelector || props.disabled || props.readonly) return;
  const pasted = event.clipboardData?.getData('text/plain') || event.clipboardData?.getData('text') || '';
  const detected = detectAbnAcnKind(pasted);
  if (detected) setKind(detected);
}

watch(
  () => model.value,
  (value) => {
    if (focused.value) return;
    if (value === undefined || value === '') {
      text.value = '';
      return;
    }
    const digits = digitsOnly(value, maxDigitsForKind(kind.value));
    if (digits !== value) {
      model.value = digits === '' ? undefined : digits;
      return;
    }
    text.value = displayOf(digits);
  },
  { immediate: true },
);

watch(kind, () => {
  const digits = digitsOnly(focused.value ? text.value : (model.value ?? ''), maxDigitsForKind(kind.value));
  commitDigits(digits);
  if (blurErrors.value.length > 0) runChecksumValidation();
});
</script>

<template>
  <div ref="root" class="r-abn-acn" @focusin="onFocusIn" @focusout="onControlFocusOut" @paste="onPaste">
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
      :rules="effectiveRules"
      validate-on="submit"
      :error="error"
      :error-messages="mergedErrorMessages"
      @update:model-value="onUpdate"
    >
      <label v-if="label" class="r-field__label" :for="fieldId">
        {{ label }}
        <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
      </label>

      <div class="r-field__control">
        <Input.Control class="r-field__input" type="text" inputmode="numeric" :placeholder="effectivePlaceholder" />
        <div
          v-if="kindSelector"
          class="r-field__kind"
          role="group"
          :aria-label="label ? `${label} type` : 'Identifier type'"
        >
          <button
            type="button"
            class="r-field__kind-btn"
            :aria-pressed="kind === 'abn'"
            :disabled="disabled || readonly"
            @click="setKind('abn')"
          >
            ABN
          </button>
          <button
            type="button"
            class="r-field__kind-btn"
            :aria-pressed="kind === 'acn'"
            :disabled="disabled || readonly"
            @click="setKind('acn')"
          >
            ACN
          </button>
        </div>
      </div>

      <Input.Description v-if="description" class="r-field__hint">{{ description }}</Input.Description>

      <Input.Error v-slot="{ errors }" class="r-field__error">
        <span v-for="message in errors" :key="message">{{ message }}</span>
      </Input.Error>
    </Input.Root>
  </div>
</template>

<style>
.r-field__kind {
  display: inline-flex;
  flex-shrink: 0;
  align-self: stretch;
  margin: 2px 0;
  border: 1px solid var(--border-input);
  border-radius: var(--r-sm);
  overflow: hidden;
}

.r-field__kind-btn {
  margin: 0;
  padding: 0 var(--sp-2);
  border: 0;
  background: transparent;
  color: var(--fg-muted);
  font: inherit;
  font-size: var(--fs-xs);
  font-family: var(--font-ui);
  line-height: 1;
  cursor: pointer;
}

.r-field__kind-btn + .r-field__kind-btn {
  border-left: 1px solid var(--border-input);
}

.r-field__kind-btn[aria-pressed='true'] {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
  font-weight: 600;
}

.r-field__kind-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.r-field__kind-btn:focus-visible {
  outline: 1px solid var(--border-focus);
  outline-offset: -1px;
}
</style>
