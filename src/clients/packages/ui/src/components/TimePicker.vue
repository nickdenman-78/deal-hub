<script setup lang="ts">
/**
 * Time entry on the platform's own `<input type="time">`.
 *
 * Same bargain as DatePicker: the native control owns the timeparts, the
 * locale clock (12h/24h), and the OS picker; we own the field chrome, Escape /
 * Tab behaviour, and ValidityState errors. The popup itself cannot be themed.
 *
 * The model is an `HH:mm` or `HH:mm:ss` string (seconds when `step` is under
 * 60). Deliberately NOT a Date — same timezone footgun as the date field.
 *
 * The native `::-webkit-calendar-picker-indicator` is hidden. Chooser open is
 * `showPicker()` from control chrome (icon + empty flex space beside the
 * timeparts); the input is sized to the parts so a click there still focuses
 * a part. Escape while the chooser is open focuses the first timepart; Tab
 * leaves in one stop (Edge / APG model).
 */
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue';
import { focusAdjacent } from '../composables/useFocusTrap';
import { timeValidityMessage } from './timeValidity';
import Icon from './Icon.vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** `HH:mm` or `HH:mm:ss`. */
    min?: string;
    max?: string;
    /**
     * Native step in seconds. Default (omitted) is minute precision; set to
     * `1` (or any value under 60) to expose a seconds part.
     */
    step?: number | string;
    disabled?: boolean;
    /**
     * Value stays readable and copyable; the clock never opens and the
     * dateparts refuse edits. A native input honours `readonly` for typing but
     * some browsers still open the picker on the indicator, so the openers are
     * guarded too.
     */
    readonly?: boolean;
    required?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    /**
     * Accessible name when there is no visible `label` — e.g. DateTimePicker
     * supplies "Date" / "Time" under a shared group label.
     */
    ariaLabel?: string;
  }>(),
  {
    label: undefined,
    description: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
    size: 'md',
    ariaLabel: undefined,
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const inputRef = useTemplateRef<HTMLInputElement>('input');
const rootRef = useTemplateRef<HTMLElement>('root');

const error = ref<string | null>(null);

const showsSeconds = computed(() => {
  if (props.step === undefined || props.step === '') return false;
  const seconds = Number(props.step);
  return Number.isFinite(seconds) && seconds < 60;
});

const ariaDescribedBy = computed(
  () =>
    [props.description ? describedBy : undefined, error.value ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined,
);

let pickerOpen = false;

function syncValidity() {
  const el = inputRef.value;
  if (!el) {
    error.value = null;
    return;
  }
  error.value = timeValidityMessage(el.validity, { min: props.min, max: props.max });
}

function openPicker() {
  const el = inputRef.value;
  if (!el || props.disabled || props.readonly) return;
  try {
    el.showPicker();
    pickerOpen = true;
  } catch {
    focusFirstTimePart();
  }
}

function onChromeClick(event: MouseEvent) {
  if (props.disabled || props.readonly) return;
  if ((event.target as Element | null)?.closest?.('input')) return;
  openPicker();
}

function onOutsidePointerDown(event: PointerEvent) {
  const root = rootRef.value;
  if (!root) return;
  if (event.target instanceof Node && root.contains(event.target)) return;
  pickerOpen = false;
}

function onChange() {
  pickerOpen = false;
  syncValidity();
}

function focusFirstTimePart() {
  const el = inputRef.value;
  if (!el || el.disabled) return;
  el.focus();
}

function tabScope(from: HTMLElement): HTMLElement {
  return from.closest<HTMLElement>('dialog, [role="dialog"]') ?? document.body;
}

function leaveOnTab(event: KeyboardEvent) {
  const input = inputRef.value;
  if (!input || input.disabled) return;
  if (event.target !== input) return;

  event.preventDefault();
  focusAdjacent(input, tabScope(input), event.shiftKey);
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey && event.key === 'ArrowDown') {
    pickerOpen = true;
    return;
  }

  if (event.key === 'Tab') {
    leaveOnTab(event);
    return;
  }

  if (event.key !== 'Escape' || !pickerOpen) return;
  pickerOpen = false;
  event.preventDefault();
  queueMicrotask(focusFirstTimePart);
}

onMounted(() => {
  window.addEventListener('pointerdown', onOutsidePointerDown, true);
  syncValidity();
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onOutsidePointerDown, true);
});
</script>

<template>
  <div
    ref="root"
    class="r-field"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
    @keydown="onKeydown"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <div class="r-field__control r-time__control" @click="onChromeClick">
      <button
        class="r-time__picker-btn"
        type="button"
        tabindex="-1"
        :disabled="disabled || readonly"
        aria-label="Open time picker"
        @click.stop="openPicker"
      >
        <Icon class="r-field__icon" name="clock" :size="14" />
      </button>
      <input
        :id="fieldId"
        ref="input"
        v-model="model"
        class="r-field__input r-time__input"
        :class="{ 'r-time__input--seconds': showsSeconds }"
        type="time"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-label="label ? undefined : ariaLabel"
        :aria-describedby="ariaDescribedBy"
        @click.stop
        @input="syncValidity"
        @change="onChange"
        @blur="syncValidity"
      />
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
  </div>
</template>

<style>
.r-time__input::-webkit-calendar-picker-indicator {
  display: none;
}

.r-time__control {
  cursor: pointer;
}

.r-time__picker-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.r-time__picker-btn:disabled {
  cursor: not-allowed;
}

.r-time__picker-btn .r-field__icon {
  color: var(--fg-faint);
}

.r-field__input.r-time__input {
  flex: 0 0 auto;
  /*
   * Sized for a 12h locale's "12:30 PM". `ch` is the advance of "0", so letter
   * parts (especially M) need headroom beyond a digit count — 8ch clipped the
   * trailing M.
   */
  width: 14ch;
  min-width: 0;
  cursor: text;
}

.r-field__input.r-time__input--seconds {
  width: 17ch;
}

.r-time__input:not(:focus):placeholder-shown {
  color: var(--fg-faint);
}

.r-field__error {
  display: flex;
  flex-direction: column;
  color: var(--ets-error-text);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

.r-field__error:empty {
  display: none;
}

.r-field:has(.r-field__error:not(:empty)) .r-field__control {
  border-color: var(--error);
}
</style>
