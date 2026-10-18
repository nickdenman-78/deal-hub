import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import Input from '../components/Input.vue';
import { resetFocusShortcutRegistry } from './focusShortcutRegistry';

function pressK(modifiers: Partial<KeyboardEvent> = {}) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true, ctrlKey: true, ...modifiers }),
  );
}

afterEach(() => {
  resetFocusShortcutRegistry();
  document.body.innerHTML = '';
});

describe('focusShortcut', () => {
  it('Ctrl+K focuses a field that opted in', async () => {
    const wrapper = mount(Input, {
      attachTo: document.body,
      props: { label: 'Name', focusShortcut: true },
    });
    await nextTick();

    pressK();

    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });

  it('cycles Ctrl+K across opted-in fields in document order', async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(Input, { label: 'Name', focusShortcut: true, 'data-id': 'a' }),
            h(Input, { label: 'Owner', focusShortcut: true, 'data-id': 'b' }),
            h(Input, { label: 'Status', focusShortcut: false, 'data-id': 'c' }),
          ]);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(3);

    pressK();
    expect(document.activeElement).toBe(inputs[0].element);

    pressK();
    expect(document.activeElement).toBe(inputs[1].element);

    pressK();
    expect(document.activeElement).toBe(inputs[0].element);

    wrapper.unmount();
  });

  it('does not register when focusShortcut is off', async () => {
    const wrapper = mount(Input, {
      attachTo: document.body,
      props: { label: 'Name', focusShortcut: false },
    });
    await nextTick();
    const before = document.activeElement;

    pressK();

    expect(document.activeElement).toBe(before);
    wrapper.unmount();
  });
});
