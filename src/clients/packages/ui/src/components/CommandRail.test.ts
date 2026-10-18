import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import Button from './Button.vue';
import CommandRail from './CommandRail.vue';
import CommandRailGroup from './CommandRailGroup.vue';
import Input from './Input.vue';

describe('CommandRail', () => {
  it('exposes a toolbar landmark', () => {
    const wrapper = mount(CommandRail, {
      props: { ariaLabel: 'Table commands' },
      slots: { default: () => h(CommandRailGroup, null, () => 'New') },
    });
    const rail = wrapper.find('[role="toolbar"]');
    expect(rail.exists()).toBe(true);
    expect(rail.attributes('aria-label')).toBe('Table commands');
  });

  it('separates adjacent groups with a rule class chain', () => {
    const wrapper = mount(CommandRail, {
      slots: {
        default: () => [
          h(CommandRailGroup, null, () =>
            h(Button, { severity: 'primary', variant: 'link', icon: 'plus' }, () => 'New'),
          ),
          h(CommandRailGroup, { end: true }, () =>
            h(Button, { severity: 'primary', variant: 'link', icon: 'refresh-cw' }, () => 'Refresh'),
          ),
        ],
      },
    });
    const groups = wrapper.findAll('.r-command-rail__group');
    expect(groups).toHaveLength(2);
    expect(groups[1].classes()).toContain('r-command-rail__group--end');
  });

  it('styles labeled fields as a row without dead :deep selectors', async () => {
    // Unscoped `:deep()` is left literal by Vue and never matches in the browser —
    // that is what left Name/Owner labels stacked above the inputs.
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(here, 'CommandRail.vue'), 'utf8');
    expect(source).toMatch(/\.r-command-rail__group\s*>\s*\.r-field\s*\{[^}]*flex-direction:\s*row/s);
    expect(source).toMatch(/\.r-command-rail__group\s*>\s*\.r-field\s*\{[^}]*flex-wrap:\s*nowrap/s);
    expect(source).toMatch(
      /\.r-command-rail__group\s*>\s*\.r-multiselect\s+\.r-multiselect__chips\s*\{[^}]*flex-wrap:\s*nowrap/s,
    );
    expect(source).toMatch(
      /\.r-command-rail__group\s*>\s*\.r-field\.r-command-rail__field--wide\s*\{[^}]*width:\s*20rem/s,
    );
    expect(source).not.toMatch(/\.r-command-rail\s+:deep\(/);
  });

  it('hides field labels by default and mirrors them onto the control title', async () => {
    const wrapper = mount(CommandRail, {
      attachTo: document.body,
      slots: {
        default: () => h(CommandRailGroup, null, () => h(Input, { size: 'sm', label: 'Name', placeholder: 'Name…' })),
      },
    });
    await nextTick();
    await nextTick();

    expect(wrapper.find('.r-command-rail').classes()).not.toContain('r-command-rail--show-labels');
    expect(wrapper.find('.r-field__control').attributes('title')).toBe('Name');

    await wrapper.setProps({ showLabels: true });
    await nextTick();
    await nextTick();

    expect(wrapper.find('.r-command-rail').classes()).toContain('r-command-rail--show-labels');
    expect(wrapper.find('.r-field__control').attributes('title')).toBeUndefined();
    wrapper.unmount();
  });
});
