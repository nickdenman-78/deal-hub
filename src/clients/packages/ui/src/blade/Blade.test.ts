import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router';
import Blade from './Blade.vue';
import BladeStack from './BladeStack.vue';

/**
 * The assumption the whole design rests on is that provide/inject reaches a
 * <RouterView> written inside a Blade's default slot — that depth follows the
 * render tree rather than the route tree. Vue patches slot content with the
 * slot host as its parent, so it should; these tests are the cheap proof,
 * because if it does not hold, close destinations, Escape targeting and the
 * dirty guard are all reading the wrong blade.
 *
 * jsdom has no layout engine, so the strip's auto-scroll and the mobile
 * collapse cannot be asserted here. Those are verified by hand in
 * apps/ui-showcase.
 */

function bladeRoute(title: string, withOutlet: boolean) {
  return defineComponent({
    name: `${title}Route`,
    setup() {
      return () =>
        h(
          Blade,
          { title },
          {
            default: () => [
              // A body control so initial-focus tests can tell "landed in the
              // blade" from "landed on the ✕" without relying on app chrome.
              h('button', { type: 'button', 'data-blade-action': title }, `${title} action`),
              ...(withOutlet ? [h(RouterView)] : []),
            ],
          },
        );
    },
  });
}

const Shell = defineComponent({
  name: 'Shell',
  setup() {
    return () => h(BladeStack, null, { default: () => [h(RouterView)] });
  },
});

function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/deals',
        component: bladeRoute('Deals', true),
        meta: { blade: true },
        children: [
          {
            path: ':id',
            component: bladeRoute('Deal', true),
            meta: { blade: true },
            children: [
              { path: 'terms', component: bladeRoute('Terms', false), meta: { blade: true } },
              { path: 'notes', component: bladeRoute('Notes', false), meta: { blade: true } },
            ],
          },
        ],
      },
    ],
  });
}

async function flushFocus(wrapper: { vm: { $nextTick: () => Promise<void> } }) {
  // BladePanel waits two ticks after ownsFocus flips (post-flush).
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
}

async function mountAt(path: string) {
  const router = makeRouter();
  await router.push(path);
  await router.isReady();

  const wrapper = mount(Shell, {
    global: { plugins: [router] },
    attachTo: document.body,
  });
  // Two ticks: Teleport lands one tick after the strip ref is assigned.
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
  return { wrapper, router };
}

describe('blade depth', () => {
  it("increments through a RouterView rendered in a blade's slot", async () => {
    const { wrapper } = await mountAt('/deals/d-1/terms');

    const panels = [...document.querySelectorAll('.r-blade')];
    expect(panels.map((p) => p.getAttribute('aria-label'))).toEqual(['Deals', 'Deal', 'Terms']);
    // `order` IS the depth, and it is what puts the panels in the right visual
    // sequence regardless of the order Teleport appended them in.
    expect(panels.map((p) => (p as HTMLElement).style.order)).toEqual(['0', '1', '2']);

    wrapper.unmount();
  });

  it('teleports panels into the strip, not into the route subtree', async () => {
    const { wrapper } = await mountAt('/deals/d-1');

    const strip = document.querySelector('.r-blade-strip');
    expect(strip).not.toBeNull();
    for (const panel of document.querySelectorAll('.r-blade')) {
      expect(panel.parentElement).toBe(strip);
    }

    wrapper.unmount();
  });

  it('unregisters the blades a shallower navigation unmounts', async () => {
    const { wrapper, router } = await mountAt('/deals/d-1/terms');
    expect(document.querySelectorAll('.r-blade')).toHaveLength(3);

    await router.push('/deals');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect([...document.querySelectorAll('.r-blade')].map((p) => p.getAttribute('aria-label'))).toEqual(['Deals']);

    wrapper.unmount();
  });

  it('derives each blade its own path, not the full URL', async () => {
    const { wrapper } = await mountAt('/deals/d-1/terms');

    // Close destination is the ancestor's derived path, so a wrong derivation
    // shows up as a ✕ that navigates somewhere unrelated. The deepest panel's
    // close button is the observable end of that chain.
    const closes = [...document.querySelectorAll('.r-blade [aria-label^="Close"]')];
    expect(closes.map((c) => c.getAttribute('aria-label'))).toEqual(['Close Deal', 'Close Terms']);
    // 'Deals' is the root blade: nowhere to close back to, so no ✕.

    wrapper.unmount();
  });

  it('does not close on Escape while a dialog is open', async () => {
    const { wrapper, router } = await mountAt('/deals/d-1/terms');
    expect(router.currentRoute.value.path).toBe('/deals/d-1/terms');

    // Native <dialog> owns Escape via cancel and does not mark keydown
    // defaultPrevented — the blade must notice the open dialog itself.
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.appendChild(dialog);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(router.currentRoute.value.path).toBe('/deals/d-1/terms');

    dialog.remove();
    wrapper.unmount();
  });

  it('moves focus into the opened blade, skipping the close button', async () => {
    const { wrapper, router } = await mountAt('/deals');
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Deals');

    await router.push('/deals/d-1');
    await flushFocus(wrapper);

    // Deepest blade wins; its body action is preferred over its ✕.
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Deal');
    expect(document.activeElement?.classList.contains('r-blade__close')).toBe(false);

    wrapper.unmount();
  });

  it('reclaims focus when a sibling blade replaces the leaf', async () => {
    const { wrapper, router } = await mountAt('/deals/d-1/terms');
    await flushFocus(wrapper);
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Terms');

    await router.push('/deals/d-1/notes');
    await flushFocus(wrapper);
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Notes');

    await router.push('/deals/d-1/terms');
    await flushFocus(wrapper);
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Terms');

    wrapper.unmount();
  });

  it('reclaims focus on the parent when a child blade closes', async () => {
    const { wrapper, router } = await mountAt('/deals/d-1/terms');
    await flushFocus(wrapper);
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Terms');

    await router.push('/deals/d-1');
    await flushFocus(wrapper);
    expect((document.activeElement as HTMLElement | null)?.getAttribute('data-blade-action')).toBe('Deal');

    wrapper.unmount();
  });
});
