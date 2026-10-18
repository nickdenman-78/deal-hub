<script setup lang="ts">
/**
 * Month selection — a year header and a grid of twelve.
 *
 * **Not the native `<input type="month">`, and that is the opposite call to
 * `DatePicker`'s.** The reasoning there was that the platform gives a whole
 * calendar for free and hand-rolling one is a big, easy-to-get-wrong component.
 * Neither half holds here. Firefox and Safari do not implement `type="month"`
 * at all — it degrades to a plain text box where the operator types `2026-08`
 * by hand with no affordance and no validation — so on two of three engines
 * there is nothing to inherit. And a month grid is not a calendar: twelve fixed
 * cells, no week starts, no locale-dependent first day, no day-of-month
 * arithmetic. The part that made a calendar unwise is the part a month grid
 * does not have.
 *
 * The model is an ISO `yyyy-MM` string — the same string the native control
 * speaks, so a screen already on `<Input type="month">` moves across without
 * touching its bindings. Never a `Date`: see the note in `monthValue.ts`.
 *
 * Keyboard is the APG grid pattern with the year as the outer axis: Left and
 * Right step a month and roll into the neighbouring year, Up and Down move a
 * row (three months), PageUp and PageDown step a year, Home and End go to
 * January and December of the year on screen. Arrows MOVE, they do not select
 * — selection is Enter or Space — because on a grid that commits on arrival,
 * arrowing across to December would set eleven wrong values on the way.
 *
 * Months outside `min`/`max` render disabled rather than absent: a grid that
 * changes shape is harder to read than one with an unavailable cell, and the
 * missing months would be the very ones the operator is looking for.
 */
import { Popover } from '@vuetify/v0/components';
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';
import FieldReadonly from './FieldReadonly.vue';
import Icon from './Icon.vue';
import { POPOVER_POSITION_TRY } from './popoverPosition';
import {
  formatMonth,
  isMonthOutOfRange,
  monthLabel,
  monthName,
  monthOfDate,
  parseMonth,
  shiftMonth,
} from './monthValue';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** Earliest selectable month, ISO `yyyy-MM`. */
    min?: string;
    /** Latest selectable month, ISO `yyyy-MM`. */
    max?: string;
    disabled?: boolean;
    /** Shows the month as a value, not a control. The grid is not rendered. */
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
    /** Shows a clear control once a month is chosen. */
    clearable?: boolean;
    /**
     * Overrides the locale used for month NAMES. The value is never localised.
     * Mostly here so tests are not at the mercy of the host.
     */
    locale?: string;
    /** Accessible name when there is no visible `label`. */
    ariaLabel?: string;
  }>(),
  {
    label: undefined,
    description: undefined,
    min: undefined,
    max: undefined,
    size: 'md',
    placeholder: 'Select month…',
    locale: undefined,
    ariaLabel: undefined,
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const open = ref(false);
const gridRef = useTemplateRef<HTMLElement>('grid');

const selected = computed(() => parseMonth(model.value));

const displayLabel = computed(() => monthLabel(model.value, props.locale));

/*
 * The year the GRID shows, which is not the selected year: paging back to 2024
 * to look around must not move the value, and closing without choosing must not
 * leave the grid somewhere else next time. Reset on every open.
 */
const viewYear = ref(selected.value?.year ?? new Date().getFullYear());

/** 1–12 with their localised names, built once per locale rather than per cell. */
const months = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    name: monthName(index + 1, props.locale, 'short'),
    full: monthName(index + 1, props.locale, 'long'),
  })),
);

const thisMonth = monthOfDate(new Date());

function valueFor(month: number): string {
  return formatMonth({ year: viewYear.value, month });
}

function isDisabled(month: number): boolean {
  return isMonthOutOfRange(valueFor(month), props.min, props.max);
}

/*
 * The roving tabindex: exactly one cell is tabbable. The selected month when it
 * is on screen, otherwise the current one — so Tab lands somewhere meaningful
 * rather than on whichever cell the browser reaches first.
 */
const activeMonth = ref(selected.value?.month ?? new Date().getMonth() + 1);

function select(month: number): void {
  if (isDisabled(month)) return;
  model.value = valueFor(month);
  activeMonth.value = month;
  open.value = false;
}

function clear(): void {
  model.value = undefined;
}

const showClear = computed(
  () => props.clearable === true && model.value !== undefined && !props.disabled && !props.readonly,
);

async function focusMonth(month: number): Promise<void> {
  activeMonth.value = month;
  await nextTick();
  gridRef.value?.querySelector<HTMLElement>(`[data-month="${month}"]`)?.focus();
}

/** Steps `delta` months from the active cell, crossing years by moving the view. */
async function move(delta: number): Promise<void> {
  const parts = parseMonth(shiftMonth(valueFor(activeMonth.value), delta) ?? '');
  if (!parts) return;

  viewYear.value = parts.year;
  await focusMonth(parts.month);
}

const GRID_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -3,
  ArrowDown: 3,
  PageUp: -12,
  PageDown: 12,
};

function onGridKeydown(event: KeyboardEvent): void {
  const delta = GRID_STEPS[event.key];
  if (delta !== undefined) {
    event.preventDefault();
    void move(delta);
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    void focusMonth(event.key === 'Home' ? 1 : 12);
  }
}

/*
 * Opening resets the view to the value's year and puts focus on the cell that
 * matters. Without the reset, paging to 2019 then pressing Escape leaves the
 * grid in 2019 for the next open, which reads as the field having changed.
 *
 * Driven off the open MODEL, not a `toggle` listener on the activator. `toggle`
 * is fired by the popover element, not by whatever opened it, so a handler on
 * the trigger never runs — which it did not, silently, leaving the grid open
 * with nothing focused and the arrow keys going to the page.
 */
watch(open, async (isOpen) => {
  if (!isOpen) return;

  const parts = selected.value;
  viewYear.value = parts?.year ?? new Date().getFullYear();
  await focusMonth(parts?.month ?? new Date().getMonth() + 1);
});
</script>

<template>
  <div
    class="r-field r-month"
    :class="[`r-field--${size}`, { 'r-field--readonly': readonly, 'r-field--disabled': disabled }]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <FieldReadonly v-if="readonly" :id="fieldId" :text="displayLabel" />

    <div v-else class="r-field__control r-month__control">
      <!-- `v-slot="{ id }"` feeds Popover.Content's own id: without it v0
           ignores `position-area`. Same note as DateRangeSelector. -->
      <Popover.Root v-slot="{ id }" v-model="open">
        <Popover.Activator
          :id="fieldId"
          class="r-month__trigger"
          :disabled="disabled"
          :aria-label="ariaLabel ?? (label ? undefined : placeholder)"
          :aria-describedby="description ? describedBy : undefined"
          :aria-expanded="open"
          aria-haspopup="dialog"
        >
          <Icon class="r-month__icon" name="calendar" :size="14" />
          <span class="r-month__value" :class="{ 'r-month__value--placeholder': !displayLabel }">
            {{ displayLabel ?? placeholder }}
          </span>
        </Popover.Activator>

        <Popover.Content
          :id="id"
          class="r-month__panel"
          role="dialog"
          tabindex="-1"
          :aria-label="label ?? 'Choose a month'"
          :position-try="POPOVER_POSITION_TRY"
          position-area="bottom span-right"
        >
          <div class="r-month__header">
            <button type="button" class="r-month__step" aria-label="Previous year" @click="viewYear -= 1">
              <Icon name="chevron-left" :size="14" />
            </button>
            <!-- aria-live: the year changes under the grid without focus moving
                 to it, so nothing else would announce the step. -->
            <span class="r-month__year" aria-live="polite">{{ viewYear }}</span>
            <button type="button" class="r-month__step" aria-label="Next year" @click="viewYear += 1">
              <Icon name="chevron-right" :size="14" />
            </button>
          </div>

          <div ref="grid" class="r-month__grid" role="group" @keydown="onGridKeydown">
            <button
              v-for="entry in months"
              :key="entry.month"
              type="button"
              class="r-month__cell"
              :class="{
                'r-month__cell--selected': valueFor(entry.month) === model,
                'r-month__cell--current': valueFor(entry.month) === thisMonth,
              }"
              :data-month="entry.month"
              :disabled="isDisabled(entry.month)"
              :aria-pressed="valueFor(entry.month) === model"
              :aria-label="`${entry.full} ${viewYear}`"
              :tabindex="entry.month === activeMonth ? 0 : -1"
              @click="select(entry.month)"
            >
              {{ entry.name }}
            </button>
          </div>
        </Popover.Content>
      </Popover.Root>

      <button
        v-if="showClear"
        type="button"
        class="r-month__clear"
        tabindex="-1"
        :aria-label="`Clear ${label ?? 'month'}`"
        @click="clear"
      >
        <Icon name="x" :size="14" />
      </button>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
.r-month__control {
  display: flex;
  align-items: center;
}

/* Bare trigger, border on the wrapper: the clear button sits BESIDE the
   activator, and a button inside a button is markup browsers reparent. Same
   arrangement as Select and MultiSelect. */
.r-month__trigger {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
  height: 100%;
  padding: 0 var(--sp-2);
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.r-month__icon {
  flex: none;
  color: var(--fg-muted);
}

.r-month__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-month__value--placeholder {
  color: var(--fg-faint);
}

.r-month__clear {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-right: var(--sp-1);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-month__clear:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-month__panel {
  z-index: 50;
  width: max(16rem, anchor-size(width));
  padding: var(--sp-2);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  box-shadow: var(--shadow-md);
}

.r-month__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
}

.r-month__step {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-month__step:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-month__year {
  font-family: var(--font-data);
  font-size: var(--fs-base);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.r-month__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-1);
}

.r-month__cell {
  padding: var(--sp-2) var(--sp-1);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  background: none;
  color: var(--fg-primary);
  font: inherit;
  cursor: pointer;
}

.r-month__cell:hover:not(:disabled) {
  background: var(--bg-surface-3);
}

/* The current month is outlined and the selected one filled: they are often the
   same cell, and an outline under a fill still reads. */
.r-month__cell--current {
  border-color: var(--border-default);
}

.r-month__cell--selected {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
  color: var(--fg-on-accent);
}

.r-month__cell:disabled {
  color: var(--fg-faint);
  cursor: not-allowed;
}
</style>
