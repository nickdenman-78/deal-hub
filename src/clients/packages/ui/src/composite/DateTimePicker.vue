<script setup lang="ts">
/**
 * Date and time as one value, two controls.
 *
 * A single native `datetime-local` would give one model for free, but it also
 * piles every datepart and timepart into one field — Tab normalisation, chrome
 * hit-targets and AM/PM width all get worse. Composing DatePicker + TimePicker
 * keeps the behaviour we already own and still speaks one string.
 *
 * The model is `yyyy-mm-ddTHH:mm` (or `…:ss` when `step` is under 60) — the
 * same shape `datetime-local` uses, with no timezone. Clearing the date clears
 * the value; a date without a time becomes midnight.
 *
 * `min` / `max` are full datetime bounds: the date half always applies, the
 * time half only on the bound's calendar day (so 2026-07-01T09:00 does not
 * force every later day to open after 09:00).
 *
 * `disabledWeekdays` / `disabledDates` forward to DatePicker — same post-
 * selection rejection as the standalone field (native chooser cannot grey them).
 */
import { computed, ref, useId, watch } from 'vue';
import DatePicker from '../components/DatePicker.vue';
import TimePicker from '../components/TimePicker.vue';
import type { Weekday } from '../components/dateValidity';
import { boundDate, boundTime, joinDateTime, splitDateTime } from './dateTime';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** `yyyy-mm-ddTHH:mm` or with seconds. */
    min?: string;
    max?: string;
    /** Forwarded to TimePicker — under 60 exposes seconds. */
    step?: number | string;
    /**
     * Forwarded to DatePicker. Days of the week that cannot be chosen
     * (`Date#getDay`: 0 = Sunday … 6 = Saturday).
     */
    disabledWeekdays?: readonly Weekday[];
    /** Forwarded to DatePicker. ISO `yyyy-mm-dd` holidays / closures. */
    disabledDates?: readonly string[];
    disabled?: boolean;
    /** Forwarded to the DatePicker/TimePicker beneath. */
    readonly?: boolean;
    required?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
    disabledWeekdays: undefined,
    disabledDates: undefined,
    size: 'md',
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;

const datePart = ref<string | undefined>();
const timePart = ref<string | undefined>();

const withSeconds = computed(() => {
  if (props.step === undefined || props.step === '') return false;
  const seconds = Number(props.step);
  return Number.isFinite(seconds) && seconds < 60;
});

const dateMin = computed(() => boundDate(props.min));
const dateMax = computed(() => boundDate(props.max));
const timeMin = computed(() => boundTime(props.min, datePart.value));
const timeMax = computed(() => boundTime(props.max, datePart.value));

/*
 * Incoming model → parts, but ONLY when they differ from what the parts already
 * spell — same guard as Ipv4Editor, so mid-edit keystrokes are not rewritten.
 */
watch(
  model,
  (next) => {
    const { date, time } = splitDateTime(next);
    if (date !== datePart.value) datePart.value = date;
    if (time !== timePart.value) timePart.value = time;
  },
  { immediate: true },
);

watch([datePart, timePart, withSeconds], ([date, time, seconds]) => {
  const next = joinDateTime(date, time, seconds);
  if ((model.value ?? undefined) === (next ?? undefined)) return;
  model.value = next;
});
</script>

<template>
  <div
    class="r-field r-datetime"
    :class="[`r-field--${size}`, { 'r-field--editable': editable, 'r-field--disabled': disabled }]"
  >
    <div v-if="label" class="r-field__label">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </div>

    <div
      class="r-datetime__row"
      role="group"
      :aria-label="label"
      :aria-describedby="description ? describedBy : undefined"
    >
      <DatePicker
        v-model="datePart"
        class="r-datetime__date"
        aria-label="Date"
        :min="dateMin"
        :max="dateMax"
        :disabled-weekdays="disabledWeekdays"
        :disabled-dates="disabledDates"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :size="size"
        :editable="editable"
      />
      <TimePicker
        v-model="timePart"
        class="r-datetime__time"
        aria-label="Time"
        :min="timeMin"
        :max="timeMax"
        :step="step"
        :disabled="disabled"
        :readonly="readonly"
        :required="required && !!datePart"
        :size="size"
        :editable="editable"
      />
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
.r-datetime__row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: var(--sp-2);
  width: 100%;
}

.r-datetime__date,
.r-datetime__time {
  /* Share the row; wrap to full width when the parent is too narrow for a pair. */
  flex: 1 1 12rem;
  min-width: 0;
}

/*
 * Nested pickers bring their own `.r-field` chrome. Flatten the extra vertical
 * rhythm so the pair reads as one control under the shared label.
 */
.r-datetime__date.r-field,
.r-datetime__time.r-field {
  gap: 0;
}

/* Stretch each field's chrome and let the input fill it — dateparts / timeparts
   stay leading, empty trailing space still opens the chooser. */
.r-datetime__date .r-field__control,
.r-datetime__time .r-field__control {
  width: 100%;
}

.r-datetime__date .r-date__input,
.r-datetime__time .r-time__input {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}
</style>
