import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import Input from '../components/Input.vue';
import { focusField } from './focusField';

/*
 * This file is the reason focusField lives in this package rather than in an
 * app.
 *
 * Input roots at a WRAPPER, so focusing the component's root element does
 * nothing at all — no error, no warning, just a shortcut that quietly stops
 * working. The first test below fails the moment Input's root stops containing
 * a focusable field, which is exactly the change that would otherwise ship
 * unnoticed and be reported weeks later as "/ doesn't focus the filter box".
 *
 * `attachTo: document.body` is required throughout: focus() is a no-op on an
 * element that is not in the document.
 */
describe('focusField', () => {
  it('descends past Input’s wrapper root to the inner <input>', () => {
    const wrapper = mount(Input, { attachTo: document.body });
    const inner = wrapper.find('input').element;

    // The component's own root is NOT the field — that is the whole problem.
    expect(wrapper.element).not.toBe(inner);

    focusField(ref(wrapper.vm));
    expect(document.activeElement).toBe(inner);

    wrapper.unmount();
  });

  it('selects existing text when asked, so the operator can type-to-replace', () => {
    const wrapper = mount(Input, { attachTo: document.body, props: { modelValue: 'existing query' } });
    const inner = wrapper.find('input').element as HTMLInputElement;

    focusField(ref(wrapper.vm), { select: true });

    expect(document.activeElement).toBe(inner);
    expect(inner.selectionStart).toBe(0);
    expect(inner.selectionEnd).toBe('existing query'.length);

    wrapper.unmount();
  });

  it('focuses a raw element directly', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    focusField(ref(input));
    expect(document.activeElement).toBe(input);

    input.remove();
  });

  it('accepts an already-unwrapped value, which is what a template binding passes', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    // Vue auto-unwraps a top-level ref inside a template expression, so by the
    // time `@show="() => focusField(myRef)"` calls in, the ref is gone.
    focusField(input);
    expect(document.activeElement).toBe(input);

    input.remove();
  });

  it('is a no-op for null, an unmounted ref, and an element with no field inside', () => {
    const before = document.activeElement;

    expect(() => focusField(null)).not.toThrow();
    expect(() => focusField(ref(null))).not.toThrow();
    expect(() => focusField(undefined)).not.toThrow();

    expect(document.activeElement).toBe(before);
  });
});
