import { mount } from '@vue/test-utils';
import { createNotificationsPlugin } from '@vuetify/v0';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { __resetConfirmForTests, confirm, useConfirm } from './useConfirm';
import { useToast, type UseToast } from './useToast';

// useToast needs the v0 plugin's provide, so it has to run inside a component.
function withToast(): UseToast {
  let api!: UseToast;
  mount(
    defineComponent({
      setup() {
        api = useToast();
        return () => h('div');
      },
    }),
    { global: { plugins: [createNotificationsPlugin()] } },
  );
  return api;
}

describe('useToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('maps the convenience methods to severities', () => {
    const toast = withToast();
    toast.success('Saved');
    toast.error('Failed');

    expect(toast.toasts.value.map((t) => t.severity)).toEqual(['success', 'error']);
    expect(toast.toasts.value[0].summary).toBe('Saved');
  });

  /*
   * The trap this pins, from v0's queue:
   *   if (isUndefined(timeout) || timeout < 0 || isPaused) return
   * A NEGATIVE timeout means "never". Zero is a 0ms timer — a toast given 0
   * vanishes on the next tick, which looks like it never appeared. Errors are
   * often the only record of a failure, so they must persist.
   */
  it('keeps error toasts on screen and lets success toasts expire', async () => {
    const toast = withToast();
    toast.success('Saved');
    toast.error('Publish failed');
    expect(toast.toasts.value).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(10_000);
    await nextTick();

    expect(toast.toasts.value.map((t) => t.severity)).toEqual(['error']);
  });

  it('treats an explicit life of 0 as "never", not as "immediately"', async () => {
    const toast = withToast();
    toast.add({ severity: 'info', summary: 'Pinned', life: 0 });

    await vi.advanceTimersByTimeAsync(10_000);
    await nextTick();

    expect(toast.toasts.value).toHaveLength(1);
  });

  it('honours a custom life', async () => {
    const toast = withToast();
    toast.add({ severity: 'info', summary: 'Brief', life: 1000 });

    await vi.advanceTimersByTimeAsync(500);
    expect(toast.toasts.value).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    await nextTick();
    expect(toast.toasts.value).toHaveLength(0);
  });

  it('dismisses on demand', async () => {
    const toast = withToast();
    toast.error('Stays until dismissed');

    toast.toasts.value[0].dismiss();
    await nextTick();
    expect(toast.toasts.value).toHaveLength(0);
  });
});

describe('confirm', () => {
  beforeEach(() => __resetConfirmForTests());

  it('resolves true when confirmed and false when cancelled', async () => {
    const { respond, open, request } = useConfirm();

    const yes = confirm({ title: 'Delete key?', message: 'Cannot be undone.' });
    expect(open.value).toBe(true);
    expect(request.value?.title).toBe('Delete key?');

    respond(true);
    await expect(yes).resolves.toBe(true);
    expect(open.value).toBe(false);

    const no = confirm({ title: 'Again?', message: '…' });
    respond(false);
    await expect(no).resolves.toBe(false);
  });

  /*
   * A second request while one is pending would otherwise strand the first
   * promise forever, and `await confirm(...)` never returning is a hang with no
   * error attached to it. Answering the abandoned one "no" is the safe
   * resolution: its caller treats it as declined and does nothing.
   */
  it('resolves an abandoned request as declined rather than stranding it', async () => {
    const { respond } = useConfirm();

    const first = confirm({ title: 'First', message: '…' });
    const second = confirm({ title: 'Second', message: '…' });

    await expect(first).resolves.toBe(false);

    respond(true);
    await expect(second).resolves.toBe(true);
  });

  it('keeps the request around after answering, so the dialog can animate out', () => {
    const { respond, request } = useConfirm();
    void confirm({ title: 'Delete key?', message: '…' });
    respond(false);

    // Blanking it here would show an empty box for the length of the transition.
    expect(request.value?.title).toBe('Delete key?');
  });
});
