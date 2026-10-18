<script setup lang="ts">
/**
 * Date entry on the platform's own `<input type="date">`.
 *
 * v0 has no DatePicker — it is on the "planned, not yet exported" list — and
 * a hand-rolled calendar is a genuinely large component: a month grid with
 * roving focus, PageUp/PageDown month stepping, Home/End week bounds,
 * localised week starts, and an announced live region for the focused date.
 * Getting that wrong is worse than not having it.
 *
 * The native control gives all of that for free, plus the platform's own
 * locale formatting and, on mobile, the OS date wheel. What it costs is
 * styling control over the popup itself, which the browser owns.
 *
 * The two call sites in config-admin are an expiry date and an audit-range
 * filter — plain single dates. Revisit this if a range picker or an
 * inline-always-visible calendar is ever needed; neither is expressible here.
 *
 * The model is an ISO `yyyy-mm-dd` string, which is what the input speaks
 * natively. Deliberately NOT a Date: constructing one from a date-only string
 * parses as UTC midnight, so anywhere behind UTC renders the previous day —
 * a bug that only shows up for some users, in some timezones, some of the time.
 *
 * The native `::-webkit-calendar-picker-indicator` is hidden, not stretched
 * over the field. Stretching it made every click hit that shadow button, so
 * Escape closed the chooser onto the indicator and a second Escape was needed
 * to reach a datepart. Chooser open is `showPicker()` from control chrome
 * (icon + the empty flex space beside the dateparts); the input is sized to
 * the dateparts so a click there still focuses/edits a part.
 *
 * Escape while the chooser is open: preventDefault (so a blade behind the
 * field does not also close) and focus the input so Chromium selects the
 * first datepart for type-to-replace.
 *
 * Tab is normalised to Edge's model: one stop on the field, Left/Right between
 * dateparts. Chrome would otherwise Tab through day/month/year (three stops);
 * there is no spec for that, so we leave on Tab and let the arrows own the
 * parts — the APG pattern for composites.
 *
 * Impossible dates (31 June) and min/max breaches surface through the input's
 * ValidityState — `badInput` / range flags — as a field error. Optional
 * `disabledWeekdays` / `disabledDates` reject weekends and holidays the same
 * way: the native chooser cannot grey those days out, so availability is
 * enforced after selection. Empty is left to `required` at submit time;
 * shouting the moment the field is cleared is how a form nags someone who has
 * not started yet.
 */
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue';
import { focusAdjacent } from '../composables/useFocusTrap';
import { dateAvailabilityMessage, dateValidityMessage, type Weekday } from './dateValidity';
import Icon from './Icon.vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** ISO `yyyy-mm-dd`. */
    min?: string;
    max?: string;
    /**
     * Days of the week that cannot be chosen (`Date#getDay`: 0 = Sunday …
     * 6 = Saturday). Pass `WEEKEND_DAYS` for Sat/Sun.
     */
    disabledWeekdays?: readonly Weekday[];
    /** ISO `yyyy-mm-dd` dates that cannot be chosen (holidays, closures). */
    disabledDates?: readonly string[];
    disabled?: boolean;
    /**
     * Value stays readable and copyable; the calendar never opens and the
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
    disabledWeekdays: undefined,
    disabledDates: undefined,
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

  el.setCustomValidity('');
  const native = dateValidityMessage(el.validity, { min: props.min, max: props.max });
  if (native) {
    error.value = native;
    return;
  }

  const availability = dateAvailabilityMessage(el.value || undefined, {
    disabledWeekdays: props.disabledWeekdays,
    disabledDates: props.disabledDates,
  });
  if (availability) {
    el.setCustomValidity(availability);
    error.value = availability;
    return;
  }

  error.value = null;
}

watch(
  () => [props.disabledWeekdays, props.disabledDates, props.min, props.max, model.value] as const,
  () => syncValidity(),
);

function openPicker() {
  const el = inputRef.value;
  if (!el || props.disabled || props.readonly) return;
  try {
    el.showPicker();
    pickerOpen = true;
  } catch {
    // Unsupported, or no user gesture — fall through to the dateparts.
    focusFirstDatePart();
  }
}

/**
 * Clicks on the control chrome (icon, padding, empty space beside the
 * dateparts) open the chooser. The input uses @click.stop so a press on a
 * datepart still focuses that part instead.
 */
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

function focusFirstDatePart() {
  const el = inputRef.value;
  if (!el || el.disabled) return;
  // Chromium focuses the first locale datepart on focus(); there is no API to
  // target a specific spinbutton. `select()` is unsafe on type=date (can clear
  // the visible value) and setSelectionRange throws InvalidStateError.
  el.focus();
}

/** Modal overlays that trap Tab — stay inside them when leaving the field. */
function tabScope(from: HTMLElement): HTMLElement {
  return from.closest<HTMLElement>('dialog, [role="dialog"]') ?? document.body;
}

function leaveOnTab(event: KeyboardEvent) {
  const input = inputRef.value;
  if (!input || input.disabled) return;
  // Datepart focus still retargets to the host input.
  if (event.target !== input) return;

  event.preventDefault();
  focusAdjacent(input, tabScope(input), event.shiftKey);
}

function onKeydown(event: KeyboardEvent) {
  // Chrome opens the chooser from the input with Alt+ArrowDown; track that too.
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
  // Defer past chooser dismissal and past focus returning to the opener button.
  queueMicrotask(focusFirstDatePart);
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

    <div class="r-field__control r-date__control" @click="onChromeClick">
      <button
        class="r-date__picker-btn"
        type="button"
        tabindex="-1"
        :disabled="disabled || readonly"
        aria-label="Open calendar"
        @click.stop="openPicker"
      >
        <Icon class="r-field__icon" name="calendar" :size="14" />
      </button>
      <input
        :id="fieldId"
        ref="input"
        v-model="model"
        class="r-field__input r-date__input"
        type="date"
        :min="min"
        :max="max"
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
    <!-- Always rendered so the region exists before the first error; empty takes no space. -->
    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
  </div>
</template>

<style>
/* Hide the native trailing indicator entirely. It used to be stretched over
     the field as the click target, which left a second focusable control in
     front of the dateparts and forced a double Escape to edit. */
.r-date__input::-webkit-calendar-picker-indicator {
  display: none;
}

.r-date__control {
  cursor: pointer;
}

.r-date__picker-btn {
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

.r-date__picker-btn:disabled {
  cursor: not-allowed;
}

.r-date__picker-btn .r-field__icon {
  /* Icon colour lives on the glyph; the button itself stays transparent. */
  color: var(--fg-faint);
}

/*
 * Size to the dateparts, not the full control. `.r-field__input` is flex:1;
 * without this override the input fills the chrome and every click is a
 * datepart hit — leaving no "empty" area to open the chooser.
 */
.r-field__input.r-date__input {
  flex: 0 0 auto;
  width: 11ch;
  min-width: 0;
  cursor: text;
}

/* Empty placeholder only — not `:invalid`, or a badInput date (31 Jun) would
     go faint on blur and look cleared rather than wrong. */
.r-date__input:not(:focus):placeholder-shown {
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
