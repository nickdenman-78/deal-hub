<script setup lang="ts">
/**
 * Single collapsed control for a DateRange: relative presets plus Custom.
 *
 * Presets snapshot into the existing DateRange model (ISO yyyy-mm-dd) — same
 * shape as DateRangePicker — so filters and stores keep one value type. The
 * collapsed label shows the matching preset name for "today", or an en-AU
 * formatted range when the value is custom / stale relative to today.
 *
 * One Popover, two panels (list ↔ custom) so Custom does not nest a second
 * top-layer popover. List uses listbox + real focus; custom is a small form
 * over two DatePickers. No @click on the Activator — browser popovertarget.
 *
 * `granularity="month"` swaps those for two MonthPickers, for data that lives
 * by the month (charges, bills). The model stays a DateRange of ISO dates —
 * From snaps to the 1st, To to the last day — so the consumer's filter code
 * does not change; only what the operator is asked to choose does.
 */
import { Popover } from '@vuetify/v0/components';
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';
import Button from '../components/Button.vue';
import DatePicker from '../components/DatePicker.vue';
import FieldReadonly from '../components/FieldReadonly.vue';
import Icon from '../components/Icon.vue';
import MonthPicker from '../components/MonthPicker.vue';
import { monthLabel } from '../components/monthValue';
import { POPOVER_POSITION_TRY } from '../components/popoverPosition';
import { trapTab } from '../composables/useFocusTrap';
import { useFocusShortcutTarget } from '../composables/useFocusShortcutTarget';
import { emptyRange, rangeProblem, type DateRange } from './dateRange';
import {
  DEFAULT_DATE_RANGE_PRESETS,
  endOfLocalMonth,
  formatDateRangeLabel,
  localToday,
  matchDateRangePreset,
  type DateRangePreset,
} from './dateRangePresets';

const CUSTOM_ID = '__custom__';

type Panel = 'list' | 'custom';

const props = withDefaults(
  defineProps<{
    presets?: readonly DateRangePreset[];
    label?: string;
    description?: string;
    placeholder?: string;
    /** ISO yyyy-mm-dd outer bounds for custom From/To. */
    min?: string;
    max?: string;
    disabled?: boolean;
    /**
     * Show the chosen range as a value. The trigger and its panel are not
     * rendered — the DatePickers inside the custom panel are unreachable while
     * read-only, so forwarding to them would not have been enough.
     */
    readonly?: boolean;
    clearable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    focusShortcut?: boolean;
    /** What Custom asks for: whole days (default) or whole months. */
    granularity?: 'day' | 'month';
  }>(),
  {
    presets: () => DEFAULT_DATE_RANGE_PRESETS,
    granularity: 'day',
    label: undefined,
    description: undefined,
    placeholder: 'Select range…',
    min: undefined,
    max: undefined,
    size: 'md',
  },
);

const model = defineModel<DateRange>({ default: () => emptyRange() });

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const rootRef = useTemplateRef<HTMLElement>('root');
const panelRef = useTemplateRef<HTMLElement>('panel');

useFocusShortcutTarget(() => props.focusShortcut === true, rootRef);

const open = ref(false);
const panel = ref<Panel>('list');
const draftFrom = ref<string | undefined>();
const draftTo = ref<string | undefined>();
const draftError = ref<string | null>(null);
const activeOptionIndex = ref(0);

const today = computed(() => localToday());

const isMonthly = computed(() => props.granularity === 'month');

/** `yyyy-mm-dd` → `yyyy-MM`; undefined passes through. */
function toMonth(iso: string | undefined): string | undefined {
  return iso ? iso.slice(0, 7) : undefined;
}

function formatMonthRangeLabel(range: DateRange): string {
  const from = monthLabel(toMonth(range.from), undefined, 'short');
  const to = monthLabel(toMonth(range.to), undefined, 'short');
  if (!from && !to) return '';
  if (from && to) return from === to ? from : `${from} – ${to}`;
  if (from) return `${from} – …`;
  return `… – ${to}`;
}

const draftFromMonth = ref<string | undefined>();
const draftToMonth = ref<string | undefined>();
const minMonth = computed(() => toMonth(props.min));
const maxMonth = computed(() => toMonth(props.max));
const fromMaxMonth = computed(() => draftToMonth.value ?? maxMonth.value);
const toMinMonth = computed(() => draftFromMonth.value ?? minMonth.value);

const matchedPreset = computed(() => matchDateRangePreset(model.value, props.presets, today.value));

const hasValue = computed(() => Boolean(model.value.from || model.value.to));

const displayLabel = computed(() => {
  if (matchedPreset.value) return matchedPreset.value.label;
  const formatted = isMonthly.value ? formatMonthRangeLabel(model.value) : formatDateRangeLabel(model.value);
  if (formatted) return formatted;
  return null;
});

const showClear = computed(() => props.clearable === true && hasValue.value && !props.disabled);

const listOptionCount = computed(() => props.presets.length + 1); // + Custom

const fromMax = computed(() => draftTo.value ?? props.max);
const toMin = computed(() => draftFrom.value ?? props.min);

const selectedOptionId = computed(() => matchedPreset.value?.id ?? (hasValue.value ? CUSTOM_ID : null));

function unwrapPanelEl(): HTMLElement | null {
  const node = panelRef.value as HTMLElement | { $el?: unknown } | null;
  if (node instanceof HTMLElement) return node;
  const el = node && typeof node === 'object' && '$el' in node ? node.$el : null;
  return el instanceof HTMLElement ? el : null;
}

function optionElements(): HTMLElement[] {
  return [...(unwrapPanelEl()?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
}

function focusOption(index: number) {
  const options = optionElements();
  if (options.length === 0) return;
  const next = Math.max(0, Math.min(index, options.length - 1));
  activeOptionIndex.value = next;
  options[next]?.focus();
}

function focusFirstInCustom() {
  const root = unwrapPanelEl();
  const input = root?.querySelector<HTMLElement>(isMonthly.value ? '.r-drs__custom button' : 'input[type="date"]');
  input?.focus();
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    panel.value = 'list';
    draftError.value = null;
    return;
  }
  panel.value = 'list';
  await nextTick();
  // Prefer the matched preset; else Custom when a custom range is set; else first.
  let index = 0;
  if (matchedPreset.value) {
    index = props.presets.findIndex((p) => p.id === matchedPreset.value!.id);
    if (index < 0) index = 0;
  } else if (hasValue.value) {
    index = props.presets.length; // Custom
  }
  focusOption(index);
});

function selectPreset(preset: DateRangePreset) {
  model.value = preset.resolve({ today: localToday() });
  open.value = false;
}

function openCustomPanel() {
  draftFrom.value = model.value.from;
  draftTo.value = model.value.to;
  draftFromMonth.value = toMonth(model.value.from);
  draftToMonth.value = toMonth(model.value.to);
  draftError.value = null;
  panel.value = 'custom';
  void nextTick(() => focusFirstInCustom());
}

function cancelCustom() {
  panel.value = 'list';
  draftError.value = null;
  void nextTick(() => focusOption(props.presets.length));
}

function applyCustom() {
  const next: DateRange = isMonthly.value
    ? {
        from: draftFromMonth.value ? `${draftFromMonth.value}-01` : undefined,
        to: draftToMonth.value ? endOfLocalMonth(`${draftToMonth.value}-01`) : undefined,
      }
    : {
        from: draftFrom.value || undefined,
        to: draftTo.value || undefined,
      };
  const problem = rangeProblem(next);
  if (problem) {
    draftError.value = problem;
    return;
  }
  draftError.value = null;
  model.value = next;
  open.value = false;
}

function clear(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  model.value = emptyRange();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return;

  if (!open.value) {
    if (event.key === 'Escape' && showClear.value) {
      event.preventDefault();
      model.value = emptyRange();
      return;
    }
    // ArrowDown / Enter open the list — same pattern as a combobox / select.
    // preventDefault so Enter does not also fire the activator's native click
    // (which would race the v-model open and leave the panel closed).
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      event.preventDefault();
      open.value = true;
    }
    return;
  }

  if (event.key === 'ArrowDown' && event.altKey) {
    event.preventDefault();
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  trapTab(event, unwrapPanelEl());

  if (panel.value === 'custom') {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelCustom();
    }
    return;
  }

  const count = listOptionCount.value;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusOption(activeOptionIndex.value + 1 >= count ? 0 : activeOptionIndex.value + 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusOption(activeOptionIndex.value - 1 < 0 ? count - 1 : activeOptionIndex.value - 1);
      break;
    case 'Home':
      event.preventDefault();
      focusOption(0);
      break;
    case 'End':
      event.preventDefault();
      focusOption(count - 1);
      break;
    case 'Escape':
      event.preventDefault();
      event.stopPropagation();
      open.value = false;
      break;
    case 'Enter':
    case ' ':
      // option button click handles activation; prevent scroll on Space.
      if (event.key === ' ') event.preventDefault();
      break;
    default:
      break;
  }
}

function onContentMouseDown(event: MouseEvent) {
  const el = event.currentTarget;
  if (!(el instanceof HTMLElement)) return;
  if (el === document.activeElement || el.contains(document.activeElement)) return;
  el.focus({ preventScroll: true });
}
</script>

<template>
  <div
    ref="root"
    class="r-field r-date-range-selector"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <FieldReadonly v-if="readonly" :id="fieldId" :text="displayLabel" />

    <div v-else class="r-field__control r-drs__control">
      <!-- `v-slot="{ id }"` feeds Popover.Content's own id below: without it v0
           ignores `position-area` entirely. See the note in Popover.vue. -->
      <Popover.Root v-slot="{ id }" v-model="open">
        <Popover.Activator
          :id="fieldId"
          class="r-drs__trigger"
          :disabled="disabled"
          :aria-label="label ?? placeholder"
          :aria-expanded="open"
          aria-haspopup="listbox"
          :aria-describedby="description ? describedBy : undefined"
          @keydown="onTriggerKeydown"
        >
          <span class="r-drs__value" :class="{ 'r-drs__value--placeholder': displayLabel === null }">
            {{ displayLabel ?? placeholder }}
          </span>
          <Icon class="r-drs__chevron" name="chevron-down" :size="14" />
        </Popover.Activator>

        <Popover.Content
          ref="panel"
          :id="id"
          class="r-drs__panel"
          :class="{ 'r-drs__panel--custom': panel === 'custom' }"
          :role="panel === 'list' ? 'listbox' : 'dialog'"
          tabindex="-1"
          :aria-label="panel === 'list' ? (label ?? 'Date range') : 'Custom date range'"
          :position-try="POPOVER_POSITION_TRY"
          position-area="bottom span-right"
          @keydown="onPanelKeydown"
          @mousedown="onContentMouseDown"
        >
          <template v-if="panel === 'list'">
            <button
              v-for="(preset, index) in presets"
              :key="preset.id"
              type="button"
              role="option"
              class="r-drs__option"
              :aria-selected="selectedOptionId === preset.id"
              :tabindex="activeOptionIndex === index ? 0 : -1"
              @click="selectPreset(preset)"
              @focus="activeOptionIndex = index"
            >
              {{ preset.label }}
            </button>
            <hr class="r-drs__separator" />
            <button
              type="button"
              role="option"
              class="r-drs__option"
              :aria-selected="selectedOptionId === CUSTOM_ID"
              :tabindex="activeOptionIndex === presets.length ? 0 : -1"
              @click="openCustomPanel"
              @focus="activeOptionIndex = presets.length"
            >
              Custom…
            </button>
          </template>

          <template v-else>
            <div v-if="isMonthly" class="r-drs__custom">
              <MonthPicker v-model="draftFromMonth" label="From" size="sm" :min="minMonth" :max="fromMaxMonth" />
              <MonthPicker v-model="draftToMonth" label="To" size="sm" :min="toMinMonth" :max="maxMonth" />
              <p v-if="draftError" class="r-field__error" role="alert">{{ draftError }}</p>
              <hr class="r-drs__custom-sep" />
              <div class="r-drs__custom-actions">
                <Button variant="outlined" size="sm" @click="cancelCustom">Cancel</Button>
                <Button severity="primary" size="sm" @click="applyCustom">Apply</Button>
              </div>
            </div>
            <div v-else class="r-drs__custom">
              <DatePicker v-model="draftFrom" label="From" size="sm" :min="min" :max="fromMax" />
              <DatePicker v-model="draftTo" label="To" size="sm" :min="toMin" :max="max" />
              <p v-if="draftError" class="r-field__error" role="alert">{{ draftError }}</p>
              <hr class="r-drs__custom-sep" />
              <div class="r-drs__custom-actions">
                <Button variant="outlined" size="sm" @click="cancelCustom">Cancel</Button>
                <Button severity="primary" size="sm" @click="applyCustom">Apply</Button>
              </div>
            </div>
          </template>
        </Popover.Content>
      </Popover.Root>

      <button
        v-if="showClear"
        type="button"
        class="r-drs__clear"
        tabindex="-1"
        :aria-label="`Clear ${label ?? 'date range'}`"
        @click="clear"
      >
        <Icon name="x" :size="14" />
      </button>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
.r-date-range-selector {
  min-width: 0;
}

.r-drs__control {
  /* Activator + optional clear share the control chrome. */
  display: flex;
  gap: var(--sp-1);
  padding-inline-end: var(--sp-1);
}

.r-drs__trigger {
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

.r-drs__trigger:focus-visible {
  outline: none;
}

.r-drs__trigger:disabled {
  cursor: not-allowed;
}

.r-drs__value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.r-drs__value--placeholder {
  color: var(--fg-faint);
}

.r-drs__chevron {
  flex: none;
  color: var(--fg-faint);
}

.r-drs__clear {
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

.r-drs__clear:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-drs__panel {
  z-index: 50;
  min-width: max(14rem, anchor-size(width));
  max-width: min(22rem, calc(100vw - var(--sp-6)));
  padding: var(--sp-1);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-primary);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
}

.r-drs__panel--custom {
  min-width: 15rem;
  width: max-content;
  height: fit-content;
  min-height: 0;
  padding: var(--sp-2);
}

.r-drs__panel:focus {
  outline: none;
}

.r-drs__option {
  display: flex;
  width: 100%;
  align-items: center;
  padding: var(--sp-2);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-primary);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.r-drs__option:hover,
.r-drs__option:focus-visible {
  background: var(--bg-surface-3);
  outline: none;
}

.r-drs__option[aria-selected='true'] {
  background: var(--bg-surface-3);
  font-weight: var(--fw-medium);
}

.r-drs__separator {
  margin: var(--sp-1) 0;
  border: 0;
  border-block-start: 1px solid var(--border-subtle);
}

.r-drs__custom {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

/* Stack From/To labels above each picker — compact column, no rail flex basis. */
.r-drs__custom .r-field {
  display: flex;
  flex: none;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--sp-1);
  width: 100%;
  min-width: 0;
  max-width: none;
}

.r-drs__custom .r-field__label {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-regular);
  line-height: var(--lh-snug);
  white-space: nowrap;
}

.r-drs__custom .r-field__control {
  width: 100%;
}

.r-drs__custom-sep {
  margin: 0;
  border: 0;
  border-block-start: 1px solid var(--border-subtle);
}

.r-drs__custom-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
}
</style>
