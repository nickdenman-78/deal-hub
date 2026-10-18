import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Timeline from './Timeline.vue';

const ITEMS = [
  { id: 's1', title: '2026-08-11 09:15:00', meta: '5m ago', trailing: 'willem' },
  { id: 's2', title: '2026-08-10 17:02:11', meta: 'yesterday', trailing: 'ops' },
  { id: 's3', title: '2026-08-01 08:00:00', meta: '10d ago', trailing: 'willem' },
];

describe('Timeline', () => {
  it('renders one entry per item with title, meta and trailing', () => {
    const wrapper = mount(Timeline, { props: { items: ITEMS } });

    const entries = wrapper.findAll('.r-timeline__entry');
    expect(entries).toHaveLength(3);
    expect(entries[0]!.find('.r-timeline__title').text()).toBe('2026-08-11 09:15:00');
    expect(entries[0]!.find('.r-timeline__meta').text()).toContain('5m ago');
    expect(entries[0]!.find('.r-timeline__trailing').text()).toBe('willem');
  });

  /* Read-only feeds must not present as interactive. */
  it('renders plain items unless selectable', () => {
    const wrapper = mount(Timeline, { props: { items: ITEMS } });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('renders buttons and records the selection when selectable', async () => {
    const wrapper = mount(Timeline, { props: { items: ITEMS, selectable: true } });

    const buttons = wrapper.findAll('button.r-timeline__item');
    expect(buttons).toHaveLength(3);

    await buttons[1]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['s2']);
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['s2']);
  });

  it('reflects the model in aria-pressed', () => {
    const wrapper = mount(Timeline, {
      props: { items: ITEMS, selectable: true, modelValue: 's3' },
    });

    const pressed = wrapper.findAll('button.r-timeline__item').map((b) => b.attributes('aria-pressed'));
    expect(pressed).toEqual(['false', 'false', 'true']);
  });

  it('exposes per-entry extras through the item-end slot', () => {
    const wrapper = mount(Timeline, {
      props: { items: ITEMS },
      slots: { 'item-end': `<template #item-end="{ item }"><i class="here">{{ item.id }}</i></template>` },
    });

    expect(wrapper.findAll('.here')).toHaveLength(3);
  });
});
