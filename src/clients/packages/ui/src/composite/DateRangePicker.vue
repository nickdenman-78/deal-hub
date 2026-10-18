<script setup lang="ts">
/**
 * A from/to date pair as one value, two controls.
 *
 * DatePicker's header parked "revisit if a range picker is ever needed"; the
 * need arrived with date-bounded filters (an audit log's From/Until). Composing
 * two DatePickers keeps the datepart behaviour we already own; what this adds
 * is the cross-constraint — each side becomes the other's bound, so an
 * inverted range cannot be *entered*, only arrived at by editing (clearing and
 * retyping the start after the end). That leftover case surfaces through
 * `rangeProblem` as a field error rather than being silently swapped:
 * a filter that quietly reverses what the operator typed reads as wrong data,
 * not as help.
 *
 * The model is a `DateRange` object (`{ from?, to? }`), not a tuple — filters
 * pass half-open ranges around by name, and `range.from` survives a refactor
 * better than `range[0]`.
 */
import { computed } from 'vue';
import DatePicker from '../components/DatePicker.vue';
import { rangeProblem, type DateRange } from './dateRange';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** ISO `yyyy-mm-dd` outer bounds for both ends. */
    min?: string;
    max?: string;
    fromLabel?: string;
    toLabel?: string;
    disabled?: boolean;
    /** Forwarded to the DatePicker beneath. */
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    min: undefined,
    max: undefined,
    fromLabel: 'From',
    toLabel: 'To',
    size: 'md',
  },
);

const model = defineModel<DateRange>({ default: () => ({}) });

const from = computed<string | undefined>({
  get: () => model.value.from,
  set: (v) => {
    model.value = { ...model.value, from: v || undefined };
  },
});

const to = computed<string | undefined>({
  get: () => model.value.to,
  set: (v) => {
    model.value = { ...model.value, to: v || undefined };
  },
});

/* Each side bounds the other, clamped inside the outer min/max. */
const fromMax = computed(() => model.value.to ?? props.max);
const toMin = computed(() => model.value.from ?? props.min);

const problem = computed(() => rangeProblem(model.value));
</script>

<template>
  <div
    class="r-field r-daterange"
    :class="[`r-field--${size}`, { 'r-field--editable': editable, 'r-field--disabled': disabled }]"
  >
    <div v-if="label" class="r-field__label">{{ label }}</div>

    <div class="r-daterange__row" role="group" :aria-label="label">
      <DatePicker
        v-model="from"
        class="r-daterange__from"
        :aria-label="fromLabel"
        :min="min"
        :max="fromMax"
        :disabled="disabled"
        :readonly="readonly"
        :size="size"
        :editable="editable"
      />
      <span class="r-daterange__sep" aria-hidden="true">–</span>
      <DatePicker
        v-model="to"
        class="r-daterange__to"
        :aria-label="toLabel"
        :min="toMin"
        :max="max"
        :disabled="disabled"
        :readonly="readonly"
        :size="size"
        :editable="editable"
      />
    </div>

    <p v-if="problem" class="r-field__error" role="alert">{{ problem }}</p>
    <p v-else-if="description" class="r-field__hint">{{ description }}</p>
  </div>
</template>

<style>
.r-daterange__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
}

.r-daterange__sep {
  color: var(--fg-muted);
}

.r-daterange__from,
.r-daterange__to {
  /* Share the row; wrap to full width when the parent is too narrow for a pair. */
  flex: 1 1 11rem;
  min-width: 0;
}

/* Nested pickers bring their own `.r-field` chrome. Flatten the extra vertical
   rhythm so the pair reads as one control under the shared label. */
.r-daterange__from.r-field,
.r-daterange__to.r-field {
  gap: 0;
}

.r-daterange__from .r-field__control,
.r-daterange__to .r-field__control {
  width: 100%;
}

.r-daterange__from .r-date__input,
.r-daterange__to .r-date__input {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}
</style>
