import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { registerEtsIcons } from '../icons';
import DateTimePicker from './DateTimePicker.vue';

beforeAll(() => registerEtsIcons());

describe('DateTimePicker', () => {
  it('splits a datetime model across the date and time controls', () => {
    const wrapper = mount(DateTimePicker, {
      props: { label: 'Effective', modelValue: '2026-07-01T09:30' },
    });

    expect((wrapper.find('input[type="date"]').element as HTMLInputElement).value).toBe('2026-07-01');
    expect((wrapper.find('input[type="time"]').element as HTMLInputElement).value).toBe('09:30');
  });

  it('joins a date change into the datetime model (midnight when time is empty)', async () => {
    const wrapper = mount(DateTimePicker, {
      props: { label: 'Effective', modelValue: undefined },
    });

    await wrapper.find('input[type="date"]').setValue('2026-08-15');
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-08-15T00:00']);
  });

  it('updates the time half without losing the date', async () => {
    const wrapper = mount(DateTimePicker, {
      props: { label: 'Effective', modelValue: '2026-07-01T09:30' },
    });

    await wrapper.find('input[type="time"]').setValue('14:00');
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-07-01T14:00']);
  });

  it('clears the model when the date is cleared', async () => {
    const wrapper = mount(DateTimePicker, {
      props: { label: 'Effective', modelValue: '2026-07-01T09:30' },
    });

    await wrapper.find('input[type="date"]').setValue('');
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });
});
