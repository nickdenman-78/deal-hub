import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref, type Ref } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { __resetFocusOriginForTests } from '../composables/useFocusOrigin';
import { registerEtsIcons } from '../icons';
import Blade from './Blade.vue';
import BladeAside from './BladeAside.vue';
import BladeStack from './BladeStack.vue';

/**
 * Regression cover for a bug that produced no error and no warning: pressing
 * Escape with an aside open closed the aside AND the blade behind it.
 *
 * The chain was entirely about focus. BladeAside catches Escape with an ELEMENT
 * handler on its root, and marks the event handled so the Blade's document-level
 * handler skips it. If focus is not inside the aside, that element handler never
 * runs — the keydown goes straight from <body> to document and closes the blade.
 */
beforeAll(() => registerEtsIcons());

function mountAside(open: Ref<boolean>, modal: boolean, body: unknown[]) {
  const Leaf = defineComponent({
    setup() {
      return () =>
        h(
          Blade,
          { title: 'Deal' },
          {
            default: () => [
              h(
                BladeAside,
                { title: 'View options', open: open.value, modal, onClose: () => (open.value = false) },
                { default: () => body },
              ),
            ],
          },
        );
    },
  });

  const Root = defineComponent({
    setup: () => () => h(Blade, { title: 'Deals' }, { default: () => [h(RouterView)] }),
  });

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/deals',
        component: Root,
        meta: { blade: true },
        children: [{ path: ':id', component: Leaf, meta: { blade: true } }],
      },
    ],
  });

  const Shell = defineComponent({
    setup: () => () => h(BladeStack, null, { default: () => [h(RouterView)] }),
  });

  return { router, Shell };
}

async function mountAt(open: Ref<boolean>, options: { modal?: boolean; body?: unknown[] } = {}) {
  const { router, Shell } = mountAside(open, options.modal === true, options.body ?? [h('p', 'Just prose.')]);
  await router.push('/deals/d-1');
  await router.isReady();
  const wrapper = mount(Shell, { global: { plugins: [router] }, attachTo: document.body });
  await nextTick();
  await nextTick();
  await nextTick();
  return wrapper;
}

beforeEach(() => {
  __resetFocusOriginForTests();
});

afterEach(() => {
  // attachTo leaves nodes behind; a stray .r-blade would be counted by the
  // next test's assertions.
  document.body.innerHTML = '';
});

describe('BladeAside focus', () => {
  it('moves focus inside itself when opened, even with nothing focusable in the body', async () => {
    const wrapper = await mountAt(ref(true));

    const aside = document.querySelector('.r-blade-aside');
    expect(aside).not.toBeNull();
    // The whole bug in one assertion: focus on <body> means Escape bypasses the
    // aside entirely.
    expect(document.activeElement).not.toBe(document.body);
    expect(aside!.contains(document.activeElement)).toBe(true);

    wrapper.unmount();
  });

  it('prefers the first form control over the close button', async () => {
    const wrapper = await mountAt(ref(true), { body: [h('input', { class: 'the-field' })] });

    expect((document.activeElement as HTMLElement).className).toContain('the-field');

    wrapper.unmount();
  });

  it('returns focus to the trigger on close, even when the click never focused it', async () => {
    const open = ref(false);
    const wrapper = await mountAt(open);

    // A trigger the browser declined to focus — the Safari case. Safari still
    // blurs whatever held focus on mousedown (here the blade's ✕, focused on
    // mount), so activeElement is <body> and records nothing; jsdom fires no
    // focus events for a synthetic pointerdown, so the blur is explicit.
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);

    open.value = true;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(document.querySelector('.r-blade-aside')!.contains(document.activeElement)).toBe(true);

    open.value = false;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
  });

  /*
   * The browser-only failure this pins: Escape calls close(true), the panel then
   * unmounts, focus leaves it, `focusout` fires on the way out, and onFocusOut
   * called close(false) — flipping the decision off again before the watcher
   * acted on it. The reader ended up on <body> having pressed Escape.
   *
   * jsdom does not fire that teardown focusout by itself, so the test dispatches
   * it explicitly. The fix is that the first close decision wins.
   */
  it('does not let a teardown focusout overwrite the Escape decision', async () => {
    const open = ref(false);
    const wrapper = await mountAt(open);

    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    // Safari blurs on mousedown without focusing the button — see above.
    (document.activeElement as HTMLElement).blur();

    open.value = true;
    await nextTick();
    await nextTick();
    await nextTick();

    const root = document.querySelector('.r-blade-aside')!;
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    // Focus leaving the panel as it tears down, with nowhere to go.
    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));

    await nextTick();
    await nextTick();

    expect(open.value).toBe(false);
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
  });

  it('leaves focus alone when the trigger has left the document', async () => {
    const open = ref(false);
    const wrapper = await mountAt(open);

    const trigger = document.createElement('button');
    const survivor = document.createElement('input');
    document.body.append(trigger, survivor);
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    open.value = true;
    await nextTick();
    await nextTick();
    await nextTick();

    // A blade closing can take its trigger with it. Focusing a detached node
    // silently sends focus to <body>, which is worse than doing nothing.
    trigger.remove();
    survivor.focus();

    open.value = false;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(survivor);

    wrapper.unmount();
  });

  it('keeps Escape from reaching the blade behind it', async () => {
    const open = ref(true);
    const wrapper = await mountAt(open);
    expect(document.querySelectorAll('.r-blade')).toHaveLength(2);

    // Dispatched from wherever focus actually is — exactly what a user does.
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await nextTick();
    await nextTick();

    expect(open.value).toBe(false);
    // The blade behind it must be untouched.
    expect(document.querySelectorAll('.r-blade')).toHaveLength(2);

    wrapper.unmount();
  });
});

describe('BladeAside modal scrim', () => {
  it('does not dismiss when closeOnScrimClick is false', async () => {
    const open = ref(true);
    const Leaf = defineComponent({
      setup() {
        return () =>
          h(
            Blade,
            { title: 'Deal' },
            {
              default: () => [
                h(BladeAside, {
                  title: 'Clone',
                  open: open.value,
                  modal: true,
                  closeOnScrimClick: false,
                  onClose: () => (open.value = false),
                }),
              ],
            },
          );
      },
    });

    const Root = defineComponent({
      setup: () => () => h(Blade, { title: 'Deals' }, { default: () => [h(RouterView)] }),
    });

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/deals',
          component: Root,
          meta: { blade: true },
          children: [{ path: ':id', component: Leaf, meta: { blade: true } }],
        },
      ],
    });

    const Shell = defineComponent({
      setup: () => () => h(BladeStack, null, { default: () => [h(RouterView)] }),
    });

    await router.push('/deals/d-1');
    await router.isReady();
    const wrapper = mount(Shell, { global: { plugins: [router] }, attachTo: document.body });
    await nextTick();
    await nextTick();
    await nextTick();

    const scrim = document.querySelector('.r-blade-aside__scrim') as HTMLElement;
    expect(scrim).not.toBeNull();
    scrim.click();
    await nextTick();

    expect(open.value).toBe(true);
    expect(document.querySelector('.r-blade-aside')).not.toBeNull();

    wrapper.unmount();
  });

  it('swallows Escape while open even when focus is outside the panel', async () => {
    const open = ref(true);
    const Leaf = defineComponent({
      setup() {
        return () =>
          h(
            Blade,
            { title: 'Deal' },
            {
              default: () => [
                h(BladeAside, {
                  title: 'Clone',
                  open: open.value,
                  modal: true,
                  closeOnScrimClick: false,
                  closeOnEscape: false,
                  onClose: () => (open.value = false),
                }),
              ],
            },
          );
      },
    });

    const Root = defineComponent({
      setup: () => () => h(Blade, { title: 'Deals' }, { default: () => [h(RouterView)] }),
    });

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/deals',
          component: Root,
          meta: { blade: true },
          children: [{ path: ':id', component: Leaf, meta: { blade: true } }],
        },
      ],
    });

    const Shell = defineComponent({
      setup: () => () => h(BladeStack, null, { default: () => [h(RouterView)] }),
    });

    await router.push('/deals/d-1');
    await router.isReady();
    const wrapper = mount(Shell, { global: { plugins: [router] }, attachTo: document.body });
    await nextTick();
    await nextTick();
    await nextTick();

    expect(document.querySelectorAll('.r-blade')).toHaveLength(2);

    // Scrim click leaves focus outside the panel — the failure mode that let
    // Escape fall through to the blade behind.
    (document.querySelector('.r-blade-aside__scrim') as HTMLElement).click();
    (document.body as HTMLElement).focus?.();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();

    expect(open.value).toBe(true);
    expect(document.querySelector('.r-blade-aside')).not.toBeNull();
    expect(document.querySelectorAll('.r-blade')).toHaveLength(2);

    wrapper.unmount();
  });
});
