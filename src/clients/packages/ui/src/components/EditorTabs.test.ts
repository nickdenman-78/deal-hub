import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EditorTabs from './EditorTabs.vue';

const TABS = [
  { id: 'a/_base.json', label: '_base.json', title: 'a/_base.json', dirty: false },
  { id: 'a/dev.json', label: 'dev.json', dirty: true },
  { id: 'a/prod.json', label: 'prod.json', dirty: false },
];

describe('EditorTabs', () => {
  it('renders one tab per entry inside a tablist', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS } });

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3);
  });

  it('renders nothing at all for an empty tab list', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: [] } });

    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
  });

  it('marks the active tab via the model and aria-selected', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS, modelValue: 'a/dev.json' } });

    const selected = wrapper.findAll('[role="tab"]').map((t) => t.attributes('aria-selected'));
    expect(selected).toEqual(['false', 'true', 'false']);
  });

  it('selects a tab on click through the model', async () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS } });

    await wrapper.findAll('[role="tab"]')[2]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a/prod.json']);
  });

  it('shows the dirty dot only on dirty tabs', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS } });

    const dots = wrapper.findAll('[role="tab"]').map((t) => t.find('.r-editor-tabs__dirty').exists());
    expect(dots).toEqual([false, true, false]);
  });

  it('emits close for the tab whose close button is pressed, without selecting it', async () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS } });

    await wrapper.findAll('.r-editor-tabs__close')[1]!.trigger('click');
    expect(wrapper.emitted('close')?.at(-1)).toEqual(['a/dev.json']);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  /* A fixed strip owns its tab lifecycle: no close affordance, no dragging. */
  it('hides close buttons and disables dragging when closable is false', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS, closable: false } });

    expect(wrapper.findAll('.r-editor-tabs__close')).toHaveLength(0);
    const draggable = wrapper.findAll('[role="tab"]').map((t) => t.attributes('draggable'));
    expect(draggable).toEqual(['false', 'false', 'false']);
  });

  it('tooltips fall back from title to label', () => {
    const wrapper = mount(EditorTabs, { props: { tabs: TABS } });

    const titles = wrapper.findAll('[role="tab"]').map((t) => t.attributes('title'));
    expect(titles).toEqual(['a/_base.json', 'dev.json', 'prod.json']);
  });

  it('applies monospace labels only when asked', () => {
    const plain = mount(EditorTabs, { props: { tabs: TABS } });
    const mono = mount(EditorTabs, { props: { tabs: TABS, mono: true } });

    expect(plain.find('.r-editor-tabs__label--mono').exists()).toBe(false);
    expect(mono.find('.r-editor-tabs__label--mono').exists()).toBe(true);
  });
});
