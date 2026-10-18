<script setup lang="ts">
/*
 * A task schedule for END USERS — run now, run once later, or run on a
 * recurring schedule — without the user ever reading or writing cron.
 * CronEditor is the expert layer for operators who think in expressions;
 * this is the layer above it, where frequency presets belong.
 *
 * The model is `{ start?, cron?, end? }` (see schedule.ts): a once-off is
 * `{ start }` alone, a recurring schedule is `{ cron, start, end? }`, and
 * undefined means nothing chosen yet. Choosing "Now" stamps the current
 * minute into `start` at selection time — re-selecting Now restamps it. A
 * fresh editor emits nothing until the user makes a choice.
 *
 * An incoming cron the controls cannot round-trip (written by an operator in
 * CronEditor, say) is held as-is and described in prose with a replace
 * affordance — merely opening this editor must never rewrite a schedule, and
 * the raw expression is deliberately never shown here.
 */
import { computed, ref, useId, watch } from 'vue';
import { useClock } from '../composables/useClock';
import Button from '../components/Button.vue';
import DatePicker from '../components/DatePicker.vue';
import Icon from '../components/Icon.vue';
import Message from '../components/Message.vue';
import Popover from '../components/Popover.vue';
import RadioGroup, { type RadioOption } from '../components/RadioGroup.vue';
import Select, { type SelectOption } from '../components/Select.vue';
import ToggleGroup, { type ToggleOption } from '../components/ToggleGroup.vue';
import { WEEKDAYS } from '../components/cron';
import DateTimePicker from './DateTimePicker.vue';
import { splitDateTime } from './dateTime';
import {
  HOUR_INTERVALS,
  MONTH_INTERVALS,
  defaultDraft,
  describeSchedule,
  draftToValue,
  formatScheduleDateTime,
  occurrencesBetween,
  scheduleNeverRuns,
  scheduleProblem,
  scheduleValuesEqual,
  toLocalDateTime,
  valueToDraft,
  type MonthlyStyle,
  type NthWeek,
  type RecurrenceUnit,
  type ScheduleMode,
  type ScheduleValue,
} from './schedule';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    disabled?: boolean;
    /** Prose summary only — for review screens. */
    readonly?: boolean;
    required?: boolean;
    /**
     * @deprecated Paints nothing. An editable field is now just a field; the
     * treatment moved to `readonly`. Kept so consumers keep compiling.
     */
    editable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Offers the upcoming run times in a popover beside the summary. */
    showOccurrences?: boolean;
    /** Earliest selectable start, `yyyy-mm-ddTHH:mm`. */
    min?: string;
  }>(),
  { label: undefined, description: undefined, size: 'md', showOccurrences: true, min: undefined },
);

const model = defineModel<ScheduleValue | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;

const draft = ref(defaultDraft());

/*
 * The DateTimePicker guard, object-shaped: incoming model → draft only when
 * it differs from what the draft already spells, so mid-edit changes are not
 * rewritten; draft → model only when the value actually changed. valueToDraft
 * keeps the previous draft's untouched branches (and the Now/Later
 * distinction, which the value alone cannot carry).
 */
watch(
  model,
  (next) => {
    if (scheduleValuesEqual(next, draftToValue(draft.value))) return;
    draft.value = valueToDraft(next, draft.value);
  },
  { immediate: true },
);

watch(
  draft,
  () => {
    const next = draftToValue(draft.value);
    if (scheduleValuesEqual(next, model.value)) return;
    model.value = next;
  },
  { deep: true },
);

const MODE_OPTIONS: RadioOption<ScheduleMode>[] = [
  { value: 'now', label: 'Now', description: 'Run immediately.' },
  { value: 'once', label: 'Later', description: 'Run once, at a chosen date and time.' },
  { value: 'recurring', label: 'Recurring schedule', description: 'Run on a repeating schedule.' },
];

/** Selecting Now stamps the current minute — including re-selecting it. */
const mode = computed({
  get: () => draft.value.mode,
  set: (next: ScheduleMode | undefined) => {
    if (next === undefined) return;
    draft.value.mode = next;
    if (next === 'now') draft.value.start = toLocalDateTime(new Date());
  },
});

const UNIT_OPTIONS: SelectOption<RecurrenceUnit>[] = [
  { value: 'hour', label: 'Hour(s)' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month(s)' },
];

const HOUR_INTERVAL_OPTIONS: SelectOption<number>[] = HOUR_INTERVALS.map((n) => ({
  value: n,
  label: String(n),
}));

const MONTH_INTERVAL_OPTIONS: SelectOption<number>[] = MONTH_INTERVALS.map((n) => ({
  value: n,
  label: String(n),
}));

/* Monday-first display order; values stay 0 = Sunday, matching cron. */
const WEEKDAY_OPTIONS: ToggleOption<number>[] = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
  value: day,
  label: WEEKDAYS[day]!.slice(0, 3),
  ariaLabel: WEEKDAYS[day],
}));

function ordinal(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 13) return `${n}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

const DAY_OF_MONTH_OPTIONS: SelectOption<number | 'L'>[] = [
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `the ${ordinal(i + 1)}` })),
  { value: 'L', label: 'the last day' },
];

const MONTHLY_STYLE_OPTIONS: RadioOption<MonthlyStyle>[] = [
  { value: 'dayOfMonth', label: 'On a day of the month' },
  { value: 'nthWeekday', label: 'On a weekday' },
];

const NTH_WEEK_OPTIONS: SelectOption<NthWeek>[] = [
  { value: 'first', label: 'first' },
  { value: 'last', label: 'last' },
];

const NTH_WEEKDAY_OPTIONS: SelectOption<number>[] = [1, 2, 3, 4, 5, 6, 0].map((day) => ({
  value: day,
  label: WEEKDAYS[day]!,
}));

const ENDS_OPTIONS: RadioOption<'forever' | 'until'>[] = [
  { value: 'forever', label: 'Runs forever' },
  { value: 'until', label: 'Until a date' },
];

const ends = computed({
  get: () => (draft.value.hasEnd ? 'until' : 'forever') as 'forever' | 'until',
  set: (next: 'forever' | 'until' | undefined) => {
    if (next === undefined) return;
    draft.value.hasEnd = next === 'until';
  },
});

/** End date can never precede the start date. */
const endMin = computed(() => splitDateTime(draft.value.start).date);

/** RadioGroup has no lg — the field sizes above md keep md radios. */
const radioSize = computed(() => (props.size === 'sm' ? 'sm' : 'md'));

const currentValue = computed(() => draftToValue(draft.value));
const problem = computed(() => scheduleProblem(draft.value));
const summary = computed(() => describeSchedule(currentValue.value));

/*
 * The occurrence list follows the wall clock: enumerating from the start of
 * the current minute means a run that just fired drops off the list within the
 * minute instead of being frozen at whatever `new Date()` was on first render.
 * Subscribed unconditionally (no conditional composables) — one shared
 * minute-granularity wake, even with showOccurrences off.
 */
const clockMinute = useClock('minute');

const occurrences = computed(() => {
  if (!props.showOccurrences) return [];
  const value = currentValue.value;
  if (!value?.cron) return [];
  return occurrencesBetween(value.cron, value.start, value.end, 5, clockMinute.value);
});

/** "Next 5 runs" — honest about a window that admits fewer. */
const occurrencesTitle = computed(() =>
  occurrences.value.length === 1 ? 'Next run' : `Next ${occurrences.value.length} runs`,
);

const foreignProse = computed(() => {
  const foreign = draft.value.foreign;
  return foreign ? describeSchedule(foreign) : '';
});

/*
 * A complete schedule that can never fire — a Later time already in the past,
 * or a recurring window that closes before its next run — gets an alert, not
 * the field-error line: the draft is structurally valid, it just describes
 * nothing. "Now" is exempt because its stamped minute MEANS run-immediately;
 * ageing past it while the form sits open is not a dead schedule. Follows the
 * wall clock, so the alert appears the minute a pending time slips into the
 * past.
 */
const noRunsMessage = computed(() => {
  if (draft.value.mode === 'now') return '';
  if (!scheduleNeverRuns(currentValue.value, clockMinute.value)) return '';
  return currentValue.value?.cron
    ? 'This schedule has no upcoming runs — it ends before the next run would fire.'
    : 'The chosen date and time is in the past — the task will not run.';
});

/** Abandons a schedule written elsewhere and starts a fresh recurring draft. */
function replaceForeign() {
  const previous = draft.value;
  draft.value = {
    ...defaultDraft(),
    mode: 'recurring',
    start: previous.start,
    hasEnd: previous.hasEnd,
    end: previous.end,
  };
}
</script>

<template>
  <div
    class="r-field r-schedule"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <div v-if="label" class="r-field__label">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </div>

    <!-- Review surface: the prose is the whole point; no controls to disable. -->
    <p v-if="readonly" class="r-schedule__summary r-schedule__summary--readonly">
      {{ summary || 'No schedule set.' }}
    </p>

    <div
      v-else
      class="r-schedule__body"
      role="group"
      :aria-label="label ?? 'Schedule'"
      :aria-describedby="description ? describedBy : undefined"
    >
      <RadioGroup
        v-model="mode"
        :label="(label ?? 'Schedule') + ' mode'"
        :options="MODE_OPTIONS"
        :disabled="disabled"
        :size="radioSize"
      />

      <p v-if="draft.mode === 'now'" class="r-schedule__now">
        Runs immediately<template v-if="draft.start"> — {{ formatScheduleDateTime(draft.start) }}</template
        >.
      </p>

      <div v-else-if="draft.mode === 'once'" class="r-schedule__pane">
        <DateTimePicker
          v-model="draft.start"
          label="Run at"
          :min="min"
          :disabled="disabled"
          :required="required"
          :size="size"
          :editable="editable"
        />
      </div>

      <div v-else-if="draft.foreign" class="r-schedule__pane r-schedule__foreign">
        <div class="r-schedule__summary-row">
          <p class="r-schedule__foreign-prose">{{ foreignProse || 'A schedule is set.' }}</p>
          <!-- Hidden, not disabled, when nothing remains to preview — a dead
               schedule already has the alert; a greyed icon beside it would
               only invite clicks that explain nothing. -->
          <span v-if="showOccurrences && occurrences.length > 0" class="r-schedule__info">
            <Popover label="Next runs" position-area="bottom span-left" :disabled="disabled">
              <template #trigger>
                <Icon class="r-field__icon" name="info" :size="14" />
              </template>
              <div class="r-schedule__occurrences">
                <p class="r-schedule__occurrences-title">{{ occurrencesTitle }}</p>
                <ol>
                  <li v-for="when in occurrences" :key="when.toISOString()">
                    {{ formatScheduleDateTime(when) }}
                  </li>
                </ol>
              </div>
            </Popover>
          </span>
        </div>
        <p class="r-schedule__foreign-note">
          This schedule was created elsewhere and cannot be edited here. Replacing it starts over.
        </p>
        <Button variant="outlined" size="sm" :disabled="disabled" @click="replaceForeign">Replace schedule</Button>
      </div>

      <div v-else class="r-schedule__pane">
        <DateTimePicker
          v-model="draft.start"
          label="Starts"
          description="The first run; later runs keep this time of day."
          :min="min"
          :disabled="disabled"
          :required="required"
          :size="size"
          :editable="editable"
        />

        <div class="r-schedule__row" role="group" aria-label="Repeat every">
          <span class="r-schedule__row-label">Repeat every</span>
          <Select
            v-if="draft.unit === 'hour'"
            v-model="draft.hourInterval"
            class="r-schedule__interval"
            aria-label="Interval"
            :options="HOUR_INTERVAL_OPTIONS"
            :disabled="disabled"
            :size="size"
            :editable="editable"
          />
          <Select
            v-if="draft.unit === 'month'"
            v-model="draft.monthInterval"
            class="r-schedule__interval"
            aria-label="Interval"
            :options="MONTH_INTERVAL_OPTIONS"
            :disabled="disabled"
            :size="size"
            :editable="editable"
          />
          <Select
            v-model="draft.unit"
            class="r-schedule__unit"
            aria-label="Repeat unit"
            :options="UNIT_OPTIONS"
            :disabled="disabled"
            :size="size"
            :editable="editable"
          />
        </div>

        <div v-if="draft.unit === 'week'" class="r-schedule__row" role="group" aria-label="On days">
          <span class="r-schedule__row-label">on</span>
          <ToggleGroup
            v-model="draft.weekdays"
            label="Days of the week"
            multiple
            :options="WEEKDAY_OPTIONS"
            :disabled="disabled"
            :size="size === 'sm' ? 'sm' : 'md'"
          />
        </div>

        <template v-if="draft.unit === 'month'">
          <RadioGroup
            v-model="draft.monthlyStyle"
            label="Monthly pattern"
            orientation="horizontal"
            :options="MONTHLY_STYLE_OPTIONS"
            :disabled="disabled"
            :size="radioSize"
          />

          <div
            v-if="draft.monthlyStyle === 'dayOfMonth'"
            class="r-schedule__row"
            role="group"
            aria-label="On day of month"
          >
            <span class="r-schedule__row-label">on</span>
            <Select
              v-model="draft.dayOfMonth"
              class="r-schedule__day"
              aria-label="Day of the month"
              :options="DAY_OF_MONTH_OPTIONS"
              :disabled="disabled"
              :size="size"
              :editable="editable"
            />
            <span class="r-schedule__row-label">of the month</span>
          </div>

          <div v-else class="r-schedule__row" role="group" aria-label="On a weekday of the month">
            <span class="r-schedule__row-label">on the</span>
            <Select
              v-model="draft.nthWeek"
              class="r-schedule__nth"
              aria-label="First or last"
              :options="NTH_WEEK_OPTIONS"
              :disabled="disabled"
              :size="size"
              :editable="editable"
            />
            <Select
              v-model="draft.nthWeekday"
              class="r-schedule__weekday"
              aria-label="Weekday"
              :options="NTH_WEEKDAY_OPTIONS"
              :disabled="disabled"
              :size="size"
              :editable="editable"
            />
            <span class="r-schedule__row-label">of the month</span>
          </div>
        </template>

        <div class="r-schedule__row r-schedule__row--ends" role="group" aria-label="Ends">
          <RadioGroup
            v-model="ends"
            label="Ends"
            orientation="horizontal"
            :options="ENDS_OPTIONS"
            :disabled="disabled"
            size="sm"
          />
          <DatePicker
            v-if="draft.hasEnd"
            v-model="draft.end"
            aria-label="End date"
            :min="endMin"
            :disabled="disabled"
            :size="size === 'lg' ? 'md' : size"
            :editable="editable"
          />
        </div>
      </div>

      <div v-if="!draft.foreign && draft.mode === 'recurring' && summary" class="r-schedule__summary-row">
        <p class="r-schedule__summary">{{ summary }}</p>
        <!-- Hidden, not disabled, when nothing remains to preview — see the
             foreign pane's twin above. -->
        <span v-if="showOccurrences && occurrences.length > 0" class="r-schedule__info">
          <Popover label="Next runs" position-area="bottom span-left" :disabled="disabled">
            <template #trigger>
              <Icon class="r-field__icon" name="info" :size="14" />
            </template>
            <div class="r-schedule__occurrences">
              <p class="r-schedule__occurrences-title">{{ occurrencesTitle }}</p>
              <ol>
                <li v-for="when in occurrences" :key="when.toISOString()">
                  {{ formatScheduleDateTime(when) }}
                </li>
              </ol>
            </div>
          </Popover>
        </span>
      </div>

      <Message v-if="noRunsMessage" class="r-schedule__no-runs" severity="error">
        {{ noRunsMessage }}
      </Message>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p v-if="!readonly" :id="errorId" class="r-field__error">{{ problem ?? '' }}</p>
  </div>
</template>

<style>
.r-schedule__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.r-schedule__pane {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  /* Indent under the radio list, aligned past the circles, so the pane reads
     as belonging to the selected option. */
  padding-left: calc(16px + var(--sp-2));
}

.r-schedule__now {
  margin: 0;
  padding-left: calc(16px + var(--sp-2));
  color: var(--fg-secondary);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
}

.r-schedule__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}

.r-schedule__row-label {
  color: var(--fg-secondary);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  white-space: nowrap;
}

/* Inline selects size to their content, not the full row. */
.r-schedule__interval.r-field,
.r-schedule__unit.r-field,
.r-schedule__day.r-field,
.r-schedule__nth.r-field,
.r-schedule__weekday.r-field {
  width: auto;
}

.r-schedule__row--ends {
  align-items: center;
}

.r-schedule__foreign {
  gap: var(--sp-2);
  align-items: flex-start;
}

.r-schedule__foreign-prose {
  margin: 0;
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
}

.r-schedule__foreign-note {
  margin: 0;
  color: var(--ets-hint-text);
  font-family: var(--font-ui);
  font-size: var(--fs-xs);
}

.r-schedule__summary-row {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.r-schedule__summary {
  margin: 0;
  color: var(--fg-secondary);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  line-height: 1.4;
}

/* The info trigger sits vertically centred beside the summary prose — same
   compact hit target as CronEditor's occurrences affordance. */
.r-schedule__info {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.r-schedule__info .r-popover__activator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.r-schedule__info .r-popover__activator .r-icon {
  display: block;
  vertical-align: 0;
}

.r-schedule__info .r-popover__activator:hover:not(:disabled) {
  background: var(--bg-surface-3);
}

.r-schedule__info .r-popover__activator:hover:not(:disabled) .r-field__icon {
  color: var(--fg-primary);
}

.r-schedule__info .r-popover__activator:disabled {
  cursor: not-allowed;
}

.r-schedule__summary--readonly {
  color: var(--fg-primary);
  font-size: var(--fs-base);
}

/* Same typography as the CronEditor occurrence popover. */
.r-schedule__occurrences {
  min-width: 16rem;
  max-width: min(28rem, calc(100vw - var(--sp-6)));
}

.r-schedule__occurrences-title {
  margin: 0 0 var(--sp-1);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-family: var(--font-ui);
}

.r-schedule__occurrences ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-schedule__occurrences li {
  padding: var(--sp-1) 0;
  font-family: var(--font-data);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.r-schedule__occurrences li + li {
  border-top: 1px solid var(--border-default);
}

/* Compact variant of the Message chrome — an inline field consequence, not a
   page-level banner. */
.r-schedule__no-runs.r-message {
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
}
</style>
