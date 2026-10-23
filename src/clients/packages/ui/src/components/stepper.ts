/*
 * Stepper vocabulary, plus the pure half of its navigation.
 *
 * Kept in a plain .ts beside the component for the same reason `cron.ts` and
 * `keyValue.ts` are: the awkward cases here are not visual. What status a step
 * carries once the flow has moved past it, which markers an operator is
 * allowed to click, and where `next()` lands when the step in between is
 * disabled are all answerable — and testable — without mounting anything.
 */
import type { InjectionKey, Ref } from 'vue';

/**
 * Derived status is one of `complete` / `current` / `upcoming`; the other three
 * only ever arrive as an explicit override on a step (see `StepperStep.status`).
 */
export type StepperStatus = 'complete' | 'current' | 'upcoming' | 'success' | 'warning' | 'error';

export interface StepperStep<TValue extends string = string> {
  /** Stable identity, and what the stepper's `v-model` carries. */
  value: TValue;
  label: string;
  /** Second line under the label. Say what the step is for, not how to do it. */
  description?: string;
  /**
   * Marker glyph while the step is current or upcoming. A completed step
   * always shows the tick — that is what the marker is for — so this is the
   * "before" glyph only.
   */
  icon?: string;
  /** Not reachable at all: skipped by `next`/`prev`, never clickable. */
  disabled?: boolean;
  /**
   * Outcome override. A step the flow finished BADLY keeps its place in the
   * strip but stops claiming it went well — config-admin's restore marks its
   * apply step `error` when rows failed. Absent means "derive it from where
   * the flow is".
   */
  status?: StepperStatus;
}

export interface StepperContext {
  /** The step currently on screen. */
  current: Readonly<Ref<string | undefined>>;
  steps: Readonly<Ref<readonly StepperStep[]>>;
}

export const stepperKey: InjectionKey<StepperContext> = Symbol('ets:stepper');

/** Position of `value` in `steps`, or -1 when it names no step. */
export function stepIndex(steps: readonly StepperStep[], value: string | undefined): number {
  if (value === undefined) return -1;
  return steps.findIndex((step) => step.value === value);
}

/**
 * Status of the step at `index` given where the flow currently is. An explicit
 * `status` on the step wins — it is the flow reporting an outcome the position
 * cannot know about.
 */
export function stepStatus(steps: readonly StepperStep[], index: number, currentIndex: number): StepperStatus {
  const step = steps[index];
  if (!step) return 'upcoming';
  if (step.status) return step.status;
  if (index < currentIndex) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * Whether the marker at `index` is a live control.
 *
 * `linear` (the default) means the strip is a way BACK, not a way forward:
 * everything up to and including the current step is clickable, nothing past
 * it is. Forward transitions belong to the flow's own gating — in a wizard
 * that ends in a destructive apply, a clickable "Confirm" marker is a way to
 * skip the review it exists to force. Turn `linear` off for flows whose steps
 * are merely sections of one form.
 */
export function isStepNavigable(
  steps: readonly StepperStep[],
  index: number,
  currentIndex: number,
  linear: boolean,
): boolean {
  const step = steps[index];
  if (!step || step.disabled) return false;
  return linear ? index <= currentIndex : true;
}

/**
 * The step `delta` positions away, skipping disabled ones and stopping at the
 * ends. Returns undefined when there is nowhere to go — callers treat that as
 * "the button should have been disabled".
 */
export function neighbourStep<TValue extends string>(
  steps: readonly StepperStep<TValue>[],
  currentIndex: number,
  delta: number,
): TValue | undefined {
  const direction = Math.sign(delta) || 1;
  let index = currentIndex + delta;
  while (index >= 0 && index < steps.length) {
    const step = steps[index];
    if (step && !step.disabled) return step.value;
    index += direction;
  }
  return undefined;
}

/** What a marker announces beyond its label. Screen readers get no colour. */
export function stepStatusWord(status: StepperStatus): string {
  switch (status) {
    case 'complete':
    case 'success':
      return 'completed';
    case 'current':
      return 'current step';
    case 'warning':
      return 'completed with warnings';
    case 'error':
      return 'failed';
    default:
      return 'not started';
  }
}
