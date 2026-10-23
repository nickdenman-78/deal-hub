<script setup lang="ts" generic="TValue extends string">
/**
 * A wizard: numbered markers across the top, one panel below them, and the
 * flow's own buttons in a footer.
 *
 * NOT tabs, and the difference is the whole point. Tabs are peers — any order,
 * all reachable, panels stay mounted so an editor keeps its undo history. A
 * stepper is a sequence with gates: step 3 exists because step 2 produced
 * something, and the operator's position in it IS state the page owns. So the
 * markers double as a progress report (done / here / not yet), and
 * `StepperPanel` renders only the active step — a later panel mounted early
 * would run its setup against inputs that do not exist yet.
 *
 * Steps arrive as an ARRAY prop while panels are compound children, which
 * looks inconsistent until you write one: the strip has to name every step
 * including the ones not reached, so that half genuinely is data, whereas a
 * panel holds arbitrary markup and belongs in a slot.
 *
 * Navigation is index arithmetic here rather than v0's `createStep`. That
 * composable is built for tickets that register themselves; feeding it from a
 * prop array would mean keeping a second copy of a list we already hold in
 * sync via a watcher, to buy `next()` / `prev()` — see `neighbourStep`, which
 * is four lines and testable on its own. Same call `DataTable` makes about v0
 * pagination.
 *
 * `v-model` is the current step's `value`, generic over the caller's own union
 * so a page can keep `'archive' | 'review' | …` rather than widening to string.
 * An unset model shows the first step; it is not an error state.
 */
import { computed, provide, toRef } from 'vue';
import Icon from './Icon.vue';
import { isStepNavigable, neighbourStep, stepIndex, stepStatus, stepStatusWord, stepperKey } from './stepper';
import type { StepperStatus, StepperStep } from './stepper';

const props = withDefaults(
  defineProps<{
    steps: readonly StepperStep<TValue>[];
    /** Names the strip for assistive tech. Required by ARIA on a nav landmark. */
    label: string;
    /** Markers only walk backwards. See `isStepNavigable`. */
    linear?: boolean;
    orientation?: 'horizontal' | 'vertical';
  }>(),
  { linear: true, orientation: 'horizontal' },
);

const model = defineModel<TValue | undefined>();

const currentIndex = computed(() => {
  const index = stepIndex(props.steps, model.value);
  return index === -1 ? 0 : index;
});
const currentStep = computed<StepperStep<TValue> | undefined>(() => props.steps[currentIndex.value]);
const currentValue = computed(() => currentStep.value?.value);

provide(stepperKey, { current: currentValue, steps: toRef(props, 'steps') });

function goTo(value: TValue) {
  model.value = value;
}

function next() {
  const value = neighbourStep(props.steps, currentIndex.value, 1);
  if (value !== undefined) model.value = value;
}

function prev() {
  const value = neighbourStep(props.steps, currentIndex.value, -1);
  if (value !== undefined) model.value = value;
}

/*
 * One object for both slots so a footer and a panel cannot disagree about
 * which step they are on.
 */
const state = computed(() => ({
  index: currentIndex.value,
  step: currentStep.value,
  isFirst: neighbourStep(props.steps, currentIndex.value, -1) === undefined,
  isLast: neighbourStep(props.steps, currentIndex.value, 1) === undefined,
  next,
  prev,
  goTo,
}));

function statusOf(index: number): StepperStatus {
  return stepStatus(props.steps, index, currentIndex.value);
}

function navigable(index: number): boolean {
  return isStepNavigable(props.steps, index, currentIndex.value, props.linear);
}

/*
 * Severity is not re-implemented here: the shared `.r-severity-*` roles carry
 * the five colour custom properties every other component paints from. An
 * upcoming step deliberately gets no role — it is chrome, not an intent.
 */
function severityClass(status: StepperStatus): string | undefined {
  switch (status) {
    case 'complete':
    case 'current':
      return 'r-severity-primary';
    case 'success':
      return 'r-severity-success';
    case 'warning':
      return 'r-severity-warning';
    case 'error':
      return 'r-severity-error';
    default:
      return undefined;
  }
}

function markerIcon(index: number): string | undefined {
  const status = statusOf(index);
  if (status === 'complete' || status === 'success') return 'check';
  if (status === 'error') return 'circle-alert';
  if (status === 'warning') return 'triangle-alert';
  return props.steps[index]?.icon;
}

/*
 * The visible marker is a number in a circle, which says nothing out loud, so
 * the accessible name carries the position and the state. It repeats the
 * label rather than replacing it — an aria-label wins over the text it wraps.
 */
function triggerLabel(step: StepperStep<TValue>, index: number): string {
  return `${step.label} — step ${index + 1} of ${props.steps.length}, ${stepStatusWord(statusOf(index))}`;
}
</script>

<template>
  <div class="r-stepper" :class="`r-stepper--${orientation}`">
    <nav class="r-stepper__nav" :aria-label="label">
      <ol class="r-stepper__list">
        <li
          v-for="(step, index) in steps"
          :key="step.value"
          class="r-stepper__step"
          :class="[`r-stepper__step--${statusOf(index)}`, severityClass(statusOf(index))]"
          :aria-current="index === currentIndex ? 'step' : undefined"
        >
          <button
            type="button"
            class="r-stepper__trigger"
            :disabled="!navigable(index)"
            :aria-label="triggerLabel(step, index)"
            @click="goTo(step.value)"
          >
            <span class="r-stepper__marker" aria-hidden="true">
              <Icon v-if="markerIcon(index)" :name="markerIcon(index)!" :size="14" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="r-stepper__text">
              <span class="r-stepper__label">{{ step.label }}</span>
              <span v-if="step.description" class="r-stepper__hint">{{ step.description }}</span>
            </span>
          </button>
          <span v-if="index < steps.length - 1" class="r-stepper__connector" aria-hidden="true" />
        </li>
      </ol>
    </nav>

    <div class="r-stepper__body">
      <slot v-bind="state" />
    </div>

    <div v-if="$slots.actions" class="r-stepper__actions">
      <slot name="actions" v-bind="state" />
    </div>
  </div>
</template>

<style>
.r-stepper {
  display: flex;
  min-height: 0;
  flex-direction: column;
  font-family: var(--font-ui);
}

.r-stepper__nav {
  flex: none;
}

.r-stepper__list {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-stepper__step {
  display: flex;
  align-items: center;
  min-width: 0;
}

/* Each step takes an equal share so the connectors are even; the last one has
   no connector to stretch, so it only claims the width its label needs. */
.r-stepper--horizontal .r-stepper__list {
  flex-direction: row;
  align-items: center;
}
.r-stepper--horizontal .r-stepper__step {
  flex: 1 1 0;
}
.r-stepper--horizontal .r-stepper__step:last-child {
  flex: 0 1 auto;
}

.r-stepper--vertical .r-stepper__list {
  flex-direction: column;
  align-items: stretch;
  gap: var(--sp-1);
}
.r-stepper--vertical .r-stepper__step {
  flex-direction: column;
  align-items: flex-start;
}

.r-stepper__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
  padding: var(--sp-1) var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  color: var(--fg-secondary);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.r-stepper__trigger:disabled {
  cursor: default;
}

.r-stepper__trigger:not(:disabled):hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-stepper__trigger:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}

.r-stepper__marker {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  background: var(--bg-surface);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
}

.r-stepper__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.r-stepper__label {
  font-size: var(--fs-md);
  line-height: var(--lh-snug);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-stepper__hint {
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Where the flow is now: solid. Where it has been: the same hue, tinted, so
   the two read as one trail without the current step losing its emphasis. */
.r-stepper__step--current .r-stepper__marker {
  border-color: var(--sev-fill);
  background: var(--sev-fill);
  color: var(--sev-on);
}
.r-stepper__step--current .r-stepper__label {
  color: var(--fg-primary);
  font-weight: var(--fw-semibold);
}

.r-stepper__step--complete .r-stepper__marker,
.r-stepper__step--success .r-stepper__marker,
.r-stepper__step--warning .r-stepper__marker,
.r-stepper__step--error .r-stepper__marker {
  border-color: var(--sev-hue);
  background: var(--sev-soft);
  color: var(--sev-ink);
}

.r-stepper__step--error .r-stepper__label,
.r-stepper__step--warning .r-stepper__label {
  color: var(--sev-ink);
}

.r-stepper__step--upcoming .r-stepper__trigger {
  color: var(--fg-muted);
}

.r-stepper__connector {
  flex: 1 1 auto;
  min-width: var(--sp-4);
  height: 1px;
  background: var(--border-default);
}

/* The trail behind the flow is drawn in the accent, so "how far in am I" is
   legible from the connectors alone at a glance. */
.r-stepper__step--complete .r-stepper__connector,
.r-stepper__step--success .r-stepper__connector,
.r-stepper__step--warning .r-stepper__connector,
.r-stepper__step--error .r-stepper__connector {
  background: var(--sev-hue);
}

.r-stepper--vertical .r-stepper__connector {
  width: 1px;
  min-width: 0;
  height: var(--sp-4);
  margin-inline-start: calc(var(--sp-2) + 0.875rem);
}

.r-stepper__body {
  min-height: 0;
  margin-top: var(--sp-4);
}

.r-stepper__panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--sp-3);
}

.r-stepper__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border-default);
}

/* Narrow viewports: the labels are what break first, so drop to markers plus
   the current step's label rather than letting five columns squeeze. */
@media (max-width: 720px) {
  .r-stepper--horizontal .r-stepper__step:not([aria-current='step']) .r-stepper__text {
    display: none;
  }
}
</style>
