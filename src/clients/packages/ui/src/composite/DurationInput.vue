<script setup lang="ts">
/**
 * A duration field — `30s`, `2h30m`, `500ms`.
 *
 * A text input rather than a number-plus-unit-dropdown pair, because the values
 * these fields hold are compound (`1d12h`) and a dropdown forces every one of
 * them through a single unit. The dropdown version also loses on round-trip: an
 * existing `90m` has to be shown either as 90 minutes or 1.5 hours, and
 * whichever is chosen rewrites a value the operator did not touch.
 *
 * The model is a STRING. It is what the config file holds, and a component that
 * hands back milliseconds makes every call site convert twice — and makes `2h`
 * and `120m`, which are different things to write down, indistinguishable.
 *
 * What it adds over a plain input is the reassurance line: `2h30m` is only
 * obviously right once something says "2 hours 30 minutes" underneath it. That
 * is where an operator catches a typo'd `2h30s`.
 */
import { computed, ref, useId, watch } from 'vue';
import Icon from '../components/Icon.vue';
import { describeDuration, durationError, formatDuration, parseDuration, type DurationUnit } from './duration';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Text stays readable; typing is refused and the presets are withdrawn. */
    readonly?: boolean;
    required?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    /** Milliseconds. Rejected below the bound, with the bound named. */
    min?: number;
    max?: number;
    /**
     * Units offered by the quick-set buttons, and the ones `normalize` will
     * express a value in. Order is ignored — output is always largest first.
     */
    units?: readonly DurationUnit[];
    /**
     * Rewrite the field to canonical form on blur — `90m` becomes `1h30m`.
     *
     * OFF by default, and that is deliberate. `90m` and `1h30m` are the same
     * duration but not the same text, and a field that silently rewrites what
     * someone typed is a field they stop trusting. Turn it on where the stored
     * form has to be consistent.
     */
    normalize?: boolean;
    /** Common values offered as buttons, e.g. `['30s', '5m', '1h']`. */
    presets?: readonly string[];
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: '30s',
    size: 'md',
    min: undefined,
    max: undefined,
    units: undefined,
    presets: undefined,
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const ariaDescribedBy = computed(
  () => [props.description ? describedBy : undefined, errorId].filter(Boolean).join(' ') || undefined,
);

/*
 * Held locally while editing rather than bound straight to the model. Typing
 * "2h30m" passes through "2", "2h", "2h3" — every one of which parses to
 * something different — and a parent that reacts to each would act on
 * durations the operator never meant to enter.
 */
const text = ref('');

watch(
  model,
  (next) => {
    if ((next ?? '') !== text.value) text.value = next ?? '';
  },
  { immediate: true },
);

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value;
  model.value = text.value;
}

function onBlur() {
  if (props.normalize !== true) return;
  const ms = parseDuration(text.value);
  if (ms === null) return;
  const canonical = formatDuration(ms, props.units ? { units: props.units } : undefined);
  text.value = canonical;
  model.value = canonical;
}

function applyPreset(preset: string) {
  text.value = preset;
  model.value = preset;
}

const parsed = computed(() => parseDuration(text.value));
const error = computed(() => durationError(text.value, { min: props.min, max: props.max, required: props.required }));

/*
 * Only shown when the value parses AND is in range — reading back "2 hours"
 * under a "maximum is 1h" complaint is two messages arguing with each other.
 */
const readback = computed(() => (error.value === undefined ? describeDuration(parsed.value) : ''));
</script>

<template>
  <div
    class="r-field r-duration"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <div class="r-field__control">
      <Icon class="r-field__icon" name="clock" :size="14" />
      <input
        :id="fieldId"
        class="r-field__input r-duration__input"
        :value="text"
        type="text"
        inputmode="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="error !== undefined ? 'true' : 'false'"
        :aria-describedby="ariaDescribedBy"
        @input="onInput"
        @blur="onBlur"
      />
    </div>

    <!--
      Presets are buttons rather than a datalist: a datalist is a suggestion an
      operator has to know is there, and these are the three values the field is
      almost always set to.
    -->
    <div v-if="presets && presets.length > 0 && !disabled && !readonly" class="r-duration__presets">
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        class="r-duration__preset"
        :aria-pressed="text.trim() === preset ? 'true' : 'false'"
        @click="applyPreset(preset)"
      >
        {{ preset }}
      </button>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
    <p v-if="readback" class="r-field__hint r-duration__readback">{{ readback }}</p>
  </div>
</template>

<style>
.r-duration__input {
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
}

.r-duration__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
}

.r-duration__preset {
  padding: 0 var(--sp-2);
  height: 22px;
  border: 1px solid var(--border-default);
  border-radius: var(--r-pill);
  background: none;
  color: var(--fg-secondary);
  font-family: var(--font-data);
  font-size: var(--fs-xs);
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.r-duration__preset:hover {
  border-color: var(--border-strong, var(--border-default));
  color: var(--fg-primary);
}

.r-duration__preset[aria-pressed='true'] {
  border-color: transparent;
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.r-duration__readback {
  color: var(--fg-muted);
  font-variant-numeric: tabular-nums;
}
</style>
