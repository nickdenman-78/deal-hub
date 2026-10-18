import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerEtsIcons } from '../icons';
import { __resetThemeForTests, bootstrapTheme, useTheme } from '../composables/useTheme';
import ThemeToggle from './ThemeToggle.vue';

beforeAll(() => registerEtsIcons());

beforeEach(() => {
  __resetThemeForTests();
  window.localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: () => {} })),
  );
  bootstrapTheme();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeToggle', () => {
  it('is icon-only by default, labelled from the cycle tooltip', () => {
    const wrapper = mount(ThemeToggle);
    const button = wrapper.find('button');

    expect(button.classes()).toContain('r-btn--icon-only');
    expect(button.attributes('aria-label')).toBe('Theme: System — click to switch to Light');
    expect(button.attributes('title')).toBe('Theme: System — click to switch to Light');
    expect(button.text()).toBe('');
  });

  it('shows the preference label when labeled', () => {
    const wrapper = mount(ThemeToggle, { props: { labeled: true } });
    expect(wrapper.find('button').text()).toBe('System');
    expect(wrapper.find('button').classes()).not.toContain('r-btn--icon-only');
  });

  it('appends the resolved OS appearance when showResolved and preference is system', () => {
    const wrapper = mount(ThemeToggle, { props: { labeled: true, showResolved: true } });
    expect(wrapper.find('button').text()).toBe('System (light)');
  });

  it('cycles the shared theme preference on click', async () => {
    const wrapper = mount(ThemeToggle);
    await wrapper.find('button').trigger('click');
    expect(useTheme().preference.value).toBe('light');
    expect(wrapper.find('button').attributes('aria-label')).toBe('Theme: Light — click to switch to Dark');
  });
});
