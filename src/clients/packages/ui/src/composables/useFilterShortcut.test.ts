import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, Teleport } from 'vue';
import Input from '../components/Input.vue';
import { resetFocusShortcutRegistry } from './focusShortcutRegistry';
import { useFilterShortcut } from './useFilterShortcut';

/*
 * The shortcut is only useful if it is unsurprising, and the two keys have
 * deliberately different rules: `/` yields to whatever you are typing in,
 * Ctrl/Cmd+K does not. Both halves are asserted here because getting either
 * backwards is the kind of thing nobody reports as a bug — they just stop
 * using the shortcut.
 */
const Host = defineComponent({
  setup() {
    const field = ref<HTMLInputElement | null>(null);
    useFilterShortcut(field);
    return () => h('input', { ref: field, 'data-filter': '' });
  },
});

/** Mirrors Groups / Services / Secrets blades: template ref → Input + useFilterShortcut. */
const InputHost = defineComponent({
  setup() {
    const field = ref<InstanceType<typeof Input> | null>(null);
    useFilterShortcut(field);
    return () => h(Input, { ref: field, placeholder: 'Filter', 'data-filter': '' });
  },
});

/** Same, but the Input lives inside a Teleport — Blade's panel path. */
const TeleportedInputHost = defineComponent({
  setup() {
    const field = ref<InstanceType<typeof Input> | null>(null);
    useFilterShortcut(field);
    return () =>
      h(Teleport, { to: 'body' }, [h(Input, { ref: field, placeholder: 'Filter', 'data-filter': 'teleported' })]);
  },
});

function press(key: string, modifiers: Partial<KeyboardEvent> = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers }));
}

let wrapper: ReturnType<typeof mount> | null = null;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  resetFocusShortcutRegistry();
  document.body.innerHTML = '';
});

describe('useFilterShortcut', () => {
  it('focuses the field on "/"', () => {
    wrapper = mount(Host, { attachTo: document.body });
    press('/');
    expect(document.activeElement).toBe(wrapper.find('[data-filter]').element);
  });

  it('leaves "/" alone while another input has focus', () => {
    wrapper = mount(Host, { attachTo: document.body });
    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();

    press('/');

    // Still in the other field — a slash typed mid-sentence must stay a slash.
    expect(document.activeElement).toBe(other);
  });

  it('honours Ctrl+K even from inside another input', () => {
    wrapper = mount(Host, { attachTo: document.body });
    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();

    press('k', { ctrlKey: true });

    expect(document.activeElement).toBe(wrapper.find('[data-filter]').element);
  });

  it('ignores Ctrl+Shift+K, which is a different browser shortcut', () => {
    wrapper = mount(Host, { attachTo: document.body });
    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();

    press('k', { ctrlKey: true, shiftKey: true });

    expect(document.activeElement).toBe(other);
  });

  it('detaches its listener on unmount', () => {
    const local = mount(Host, { attachTo: document.body });
    const field = local.find('[data-filter]').element;
    local.unmount();

    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();
    press('/');

    // The detached field must not be re-focused after its host is gone.
    expect(document.activeElement).not.toBe(field);
  });

  it('focuses an Input component ref on "/"', async () => {
    wrapper = mount(InputHost, { attachTo: document.body });
    await nextTick();

    press('/');

    expect(document.activeElement).toBe(wrapper.find('input').element);
  });

  it('focuses a Teleported Input component ref on Ctrl+K', async () => {
    wrapper = mount(TeleportedInputHost, { attachTo: document.body });
    await nextTick();

    expect(document.querySelector('.r-field__input')).toBeTruthy();

    press('k', { ctrlKey: true });

    expect(document.activeElement?.classList.contains('r-field__input')).toBe(true);
  });
});
