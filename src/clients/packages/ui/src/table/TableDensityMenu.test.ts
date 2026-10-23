import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { registerEtsIcons } from '../icons';
import Menu from '../components/Menu.vue';
import TableDensityMenu from './TableDensityMenu.vue';
import type { MenuItem } from '../components/Menu.vue';

beforeAll(() => registerEtsIcons());

describe('TableDensityMenu', () => {
  it('names the activator for assistive tech — the glyph alone says nothing', () => {
    const wrapper = mount(TableDensityMenu, { props: { modelValue: 'compact' } });
    const trigger = wrapper.find('.r-menu__activator');

    expect(trigger.attributes('aria-label')).toBe('Row density');
    expect(trigger.attributes('title')).toBe('Row density');
    expect(trigger.classes()).toContain('r-command-rail__menu-trigger');
  });

  it('marks the current density with a check so the three options stay aligned', () => {
    const wrapper = mount(TableDensityMenu, { props: { modelValue: 'standard' } });
    const items = wrapper.findComponent(Menu).props('items') as MenuItem[];

    expect(items.map((item) => item.label)).toEqual(['Compact', 'Standard', 'Comfortable']);
    expect(items[1]?.icon).toBe('check');
    expect(items[0]?.icon).toBeUndefined();
    expect(items[2]?.icon).toBeUndefined();
  });

  it('emits the chosen density from a menu action', () => {
    const wrapper = mount(TableDensityMenu, { props: { modelValue: 'compact' } });
    const items = wrapper.findComponent(Menu).props('items') as MenuItem[];

    items[2]?.action?.();

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['comfortable']);
  });
});
