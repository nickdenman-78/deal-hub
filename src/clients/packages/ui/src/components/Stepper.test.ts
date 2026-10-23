/*
 * The module and the component share this file rather than splitting into
 * `stepper.test.ts` + `Stepper.test.ts`: those two names are the same path on
 * a case-insensitive filesystem, and one silently overwrites the other.
 */
import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { h } from 'vue';
import { registerEtsIcons } from '../icons';
import Stepper from './Stepper.vue';
import StepperPanel from './StepperPanel.vue';
import { isStepNavigable, neighbourStep, stepIndex, stepStatus, stepStatusWord } from './stepper';
import type { StepperStep } from './stepper';

beforeAll(() => registerEtsIcons());

const STEPS: StepperStep[] = [
  { value: 'archive', label: 'Archive' },
  { value: 'review', label: 'Review' },
  { value: 'confirm', label: 'Confirm' },
];

describe('stepIndex', () => {
  it('reports -1 for a value that names no step, so the caller can fall back', () => {
    expect(stepIndex(STEPS, 'review')).toBe(1);
    expect(stepIndex(STEPS, 'nope')).toBe(-1);
    expect(stepIndex(STEPS, undefined)).toBe(-1);
  });
});

describe('stepStatus', () => {
  it('derives done / here / not yet from the position', () => {
    expect(stepStatus(STEPS, 0, 2)).toBe('complete');
    expect(stepStatus(STEPS, 2, 2)).toBe('current');
    expect(stepStatus(STEPS, 1, 0)).toBe('upcoming');
  });

  it('lets the flow override the outcome — a finished step can still have failed', () => {
    const steps: StepperStep[] = [...STEPS, { value: 'result', label: 'Result', status: 'error' }];

    expect(stepStatus(steps, 3, 3)).toBe('error');
  });
});

describe('isStepNavigable', () => {
  it('linear strips walk backwards only — forward is the flow’s gate, not the marker’s', () => {
    expect(isStepNavigable(STEPS, 0, 2, true)).toBe(true);
    expect(isStepNavigable(STEPS, 2, 2, true)).toBe(true);
    expect(isStepNavigable(STEPS, 2, 1, true)).toBe(false);
  });

  it('non-linear strips reach every step', () => {
    expect(isStepNavigable(STEPS, 2, 0, false)).toBe(true);
  });

  it('never offers a disabled step, in either mode', () => {
    const steps: StepperStep[] = [{ value: 'a', label: 'A', disabled: true }, ...STEPS];

    expect(isStepNavigable(steps, 0, 2, true)).toBe(false);
    expect(isStepNavigable(steps, 0, 2, false)).toBe(false);
  });
});

describe('neighbourStep', () => {
  it('steps one either way', () => {
    expect(neighbourStep(STEPS, 1, 1)).toBe('confirm');
    expect(neighbourStep(STEPS, 1, -1)).toBe('archive');
  });

  it('skips over a disabled step rather than landing on it', () => {
    const steps: StepperStep[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];

    expect(neighbourStep(steps, 0, 1)).toBe('c');
    expect(neighbourStep(steps, 2, -1)).toBe('a');
  });

  it('stops at the ends instead of wrapping — a wizard is not a carousel', () => {
    expect(neighbourStep(STEPS, 2, 1)).toBeUndefined();
    expect(neighbourStep(STEPS, 0, -1)).toBeUndefined();
  });

  it('returns undefined when every step in that direction is disabled', () => {
    const steps: StepperStep[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];

    expect(neighbourStep(steps, 0, 1)).toBeUndefined();
  });
});

describe('stepStatusWord', () => {
  it('says out loud what the colour says visually', () => {
    expect(stepStatusWord('complete')).toBe('completed');
    expect(stepStatusWord('current')).toBe('current step');
    expect(stepStatusWord('upcoming')).toBe('not started');
    expect(stepStatusWord('error')).toBe('failed');
    expect(stepStatusWord('warning')).toBe('completed with warnings');
  });
});

function mountStepper(modelValue: string | undefined, props: Record<string, unknown> = {}) {
  return mount(Stepper, {
    props: { steps: STEPS, label: 'Restore', modelValue, ...props },
    slots: {
      default: `
        <StepperPanel value="archive">pick a file</StepperPanel>
        <StepperPanel value="review">review it</StepperPanel>
        <StepperPanel value="confirm">confirm it</StepperPanel>
      `,
    },
    global: { components: { StepperPanel } },
  });
}

describe('Stepper', () => {
  it('shows the first step when the model names none — an unset wizard is at the start', () => {
    const wrapper = mountStepper(undefined);

    expect(wrapper.findAll('li')[0]?.attributes('aria-current')).toBe('step');
    expect(wrapper.text()).toContain('pick a file');
  });

  it('renders only the active panel, so a later step never runs against absent data', () => {
    const wrapper = mountStepper('review');

    expect(wrapper.findAll('.r-stepper__panel')).toHaveLength(1);
    expect(wrapper.text()).toContain('review it');
    expect(wrapper.text()).not.toContain('pick a file');
  });

  it('marks passed steps complete and leaves the ones ahead upcoming', () => {
    const items = mountStepper('review').findAll('li');

    expect(items[0]?.classes()).toContain('r-stepper__step--complete');
    expect(items[1]?.classes()).toContain('r-stepper__step--current');
    expect(items[2]?.classes()).toContain('r-stepper__step--upcoming');
  });

  it('disables the markers ahead of the flow while linear — forward is the flow’s gate', () => {
    const buttons = mountStepper('review').findAll('.r-stepper__trigger');

    expect(buttons[0]?.attributes('disabled')).toBeUndefined();
    expect(buttons[2]?.attributes('disabled')).toBeDefined();
  });

  it('opens every marker when linear is off', () => {
    const buttons = mountStepper('review', { linear: false }).findAll('.r-stepper__trigger');

    expect(buttons[2]?.attributes('disabled')).toBeUndefined();
  });

  it('names each marker with its position and state — the glyph is a bare number', () => {
    const buttons = mountStepper('review').findAll('.r-stepper__trigger');

    expect(buttons[0]?.attributes('aria-label')).toBe('Archive — step 1 of 3, completed');
    expect(buttons[1]?.attributes('aria-label')).toBe('Review — step 2 of 3, current step');
    expect(buttons[2]?.attributes('aria-label')).toBe('Confirm — step 3 of 3, not started');
  });

  it('emits the clicked step so the page owns the position', async () => {
    const wrapper = mountStepper('review');

    await wrapper.findAll('.r-stepper__trigger')[0]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['archive']);
  });

  it('reports the ends through the slot so a footer can disable its own buttons', () => {
    const wrapper = mount(Stepper, {
      props: { steps: STEPS, label: 'Restore', modelValue: 'confirm' },
      slots: {
        actions: (state: { isFirst: boolean; isLast: boolean }) => h('span', `${state.isFirst}/${state.isLast}`),
      },
    });

    expect(wrapper.find('.r-stepper__actions').text()).toBe('false/true');
  });
});
