import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Button from './Button.vue';
import source from './Button.vue?raw';

describe('Button busy', () => {
  it('disables the button, announces aria-busy and keeps the label visible', () => {
    const wrapper = mount(Button, { props: { busy: true, icon: 'search' }, slots: { default: 'Searching…' } });
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeDefined();
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.classes()).toContain('r-btn--busy');
    expect(button.find('.r-btn__spinner').exists()).toBe(false);
    expect(button.text()).toContain('Searching…');
  });

  it('is an ordinary enabled button when not busy', async () => {
    const wrapper = mount(Button, { props: { busy: true }, slots: { default: 'Search' } });
    await wrapper.setProps({ busy: false });
    const button = wrapper.find('button');

    expect(button.attributes('disabled')).toBeUndefined();
    expect(button.attributes('aria-busy')).toBeUndefined();
    expect(button.classes()).not.toContain('r-btn--busy');
  });

  it('pulses the content with an !important animation so reduced motion cannot freeze it', () => {
    expect(source).toMatch(
      /\.r-btn--busy \.r-btn__content \{\s*animation: r-btn-busy 1\.4s ease-in-out infinite !important;/,
    );
    expect(source).toMatch(/^@keyframes r-btn-busy \{/m);
  });
});
