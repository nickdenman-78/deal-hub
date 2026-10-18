<script setup lang="ts">
/**
 * Text field with optional sanitize + resting display format.
 * Same chrome as `Input`.
 *
 * - `mask` — sanitize into `v-model` on every change (digits-only, slugify).
 *   Must not insert display-only tokens (grouping spaces, thousands separators).
 * - `blurMask` — display-only when the control is resting. Never written to
 *   `v-model`. On focus the field shows the raw model again.
 *
 * Not a password disguise and not a fixed `###-##` pattern mask.
 */
import { nextTick, ref, watch } from 'vue';
import Input from './Input.vue';
import type { InputSize } from './Input.vue';
import type { MaskFn } from './mask';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    icon?: string;
    editable?: boolean;
    /** Native autocomplete token, e.g. `cc-number`. */
    autocomplete?: string;
    /** Extra attributes on the native `<input>` (manager ignore flags, etc.). */
    inputAttrs?: Record<string, string | number | boolean | undefined>;
    /**
     * Sanitize on every change → `v-model`. Omit display separators here;
     * use `blurMask` for those.
     */
    mask?: MaskFn;
    /**
     * Resting display only (e.g. `4111 1111 …`, `1,234.50`). Not stored in
     * `v-model`.
     */
    blurMask?: MaskFn;
  }>(),
  {
    label: undefined,
    description: undefined,
    type: 'text',
    placeholder: undefined,
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
    icon: undefined,
    autocomplete: undefined,
    inputAttrs: undefined,
    mask: undefined,
    blurMask: undefined,
  },
);

const model = defineModel<string | undefined>();
const focused = ref(false);
const root = ref<HTMLElement>();
/** What the <input> shows: raw while focused, `blurMask(raw)` when resting. */
const text = ref('');

function sanitize(raw: string): string {
  return props.mask ? props.mask(raw) : raw;
}

function displayOf(raw: string): string {
  return props.blurMask ? props.blurMask(raw) : raw;
}

function commitRaw(raw: string) {
  const next = raw === '' ? undefined : raw;
  model.value = next;
  text.value = next === undefined ? '' : focused.value ? next : displayOf(next);
}

function restoreCaret(keptBeforeCaret: number) {
  void nextTick(() => {
    const input = root.value?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return;
    if (input.value !== text.value) input.value = text.value;
    const pos = Math.min(Math.max(keptBeforeCaret, 0), text.value.length);
    input.setSelectionRange(pos, pos);
  });
}

function onUpdate(value: string | undefined) {
  const input = root.value?.querySelector('input');
  const caret = input instanceof HTMLInputElement ? (input.selectionStart ?? 0) : 0;
  const incoming = value ?? '';
  const keptBefore = sanitize(incoming.slice(0, caret)).length;
  const raw = sanitize(incoming);

  text.value = raw;
  model.value = raw === '' ? undefined : raw;
  if (focused.value) restoreCaret(keptBefore);
}

function onFocusIn() {
  if (focused.value) return;
  focused.value = true;
  const raw = model.value === undefined || model.value === '' ? '' : sanitize(model.value);
  text.value = raw;
}

function onFocusOut(event: FocusEvent) {
  const el = root.value;
  const next = event.relatedTarget;
  if (el && next instanceof Node && el.contains(next)) return;

  focused.value = false;
  const raw = sanitize(text.value);
  commitRaw(raw);
}

watch(
  () => [model.value, props.blurMask] as const,
  ([value]) => {
    if (focused.value) return;
    if (value === undefined || value === '') {
      text.value = '';
      return;
    }
    const raw = sanitize(value);
    if (raw !== value) {
      model.value = raw === '' ? undefined : raw;
      return;
    }
    text.value = displayOf(raw);
  },
  { immediate: true },
);
</script>

<template>
  <div ref="root" class="r-masked" @focusin="onFocusIn" @focusout="onFocusOut">
    <Input
      :model-value="text"
      :label="label"
      :description="description"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :rules="rules"
      :error="error"
      :error-messages="errorMessages"
      :size="size"
      :icon="icon"
      :editable="editable"
      :autocomplete="autocomplete"
      :input-attrs="inputAttrs"
      @update:model-value="onUpdate"
    />
  </div>
</template>
