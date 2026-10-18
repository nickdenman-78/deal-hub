import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useIdleTimeout, type IdleTimeoutHandle, type IdleTimeoutOptions } from './useIdleTimeout';

/*
 * The `mousemove` exclusion asserted below is a SECURITY property, not a
 * preference: counting incidental cursor drift as activity would keep a session
 * alive indefinitely on an unattended machine, which is the entire thing the
 * inactivity logout exists to prevent. It is the first thing a re-implementation
 * would get wrong, so it gets its own test.
 */
function host(options: IdleTimeoutOptions) {
  let handle!: IdleTimeoutHandle;
  const wrapper = mount(
    defineComponent({
      setup() {
        handle = useIdleTimeout(options);
        return () => h('div');
      },
    }),
  );
  return { wrapper, handle };
}

/** Advances the fake clock AND wall-clock time, which the composable derives from. */
function idle(seconds: number) {
  vi.advanceTimersByTime(seconds * 1000);
}

beforeEach(() => {
  vi.useFakeTimers();
  // Date.now() must move with the timers: the composable reads wall-clock
  // deltas rather than counting ticks, precisely so background-tab throttling
  // cannot extend a session.
  vi.setSystemTime(new Date(2026, 0, 1, 9, 0, 0));
});

afterEach(() => vi.useRealTimers());

describe('useIdleTimeout', () => {
  it('raises the warning at (timeout - warning) and counts down', () => {
    const { wrapper, handle } = host({ timeoutSeconds: 60, warningSeconds: 10, onTimeout: () => {} });

    idle(49);
    expect(handle.warningActive.value).toBe(false);

    idle(1); // 50s idle — inside the window
    expect(handle.warningActive.value).toBe(true);
    expect(handle.secondsRemaining.value).toBe(10);

    idle(5);
    expect(handle.secondsRemaining.value).toBe(5);

    wrapper.unmount();
  });

  it('fires onTimeout exactly once, then stops', () => {
    const onTimeout = vi.fn();
    const { wrapper } = host({ timeoutSeconds: 30, warningSeconds: 10, onTimeout });

    idle(30);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    idle(120);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('treats a keypress as activity and clears the warning', () => {
    const { wrapper, handle } = host({ timeoutSeconds: 60, warningSeconds: 10, onTimeout: () => {} });

    idle(55);
    expect(handle.warningActive.value).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(handle.warningActive.value).toBe(false);

    wrapper.unmount();
  });

  it('does NOT treat mousemove as activity — an unattended machine still logs out', () => {
    const onTimeout = vi.fn();
    const { wrapper, handle } = host({ timeoutSeconds: 60, warningSeconds: 10, onTimeout });

    idle(55);
    expect(handle.warningActive.value).toBe(true);

    // A bumped desk, or a cursor drifting over the window.
    for (let i = 0; i < 20; i++) window.dispatchEvent(new MouseEvent('mousemove'));

    expect(handle.warningActive.value).toBe(true);
    idle(5);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('reset() counts as activity', () => {
    const { wrapper, handle } = host({ timeoutSeconds: 60, warningSeconds: 10, onTimeout: () => {} });

    idle(55);
    handle.reset();
    expect(handle.warningActive.value).toBe(false);

    idle(30); // 30s since the reset, nowhere near the timeout
    expect(handle.warningActive.value).toBe(false);

    wrapper.unmount();
  });

  it('is completely inert when disabled', () => {
    const onTimeout = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const { wrapper, handle } = host({
      timeoutSeconds: 5,
      warningSeconds: 2,
      onTimeout,
      enabled: false,
    });

    idle(600);

    expect(onTimeout).not.toHaveBeenCalled();
    expect(handle.warningActive.value).toBe(false);
    // Mounted app-wide including the public landing page, so it must attach
    // nothing at all when there is no session to protect.
    expect(addSpy).not.toHaveBeenCalled();

    addSpy.mockRestore();
    wrapper.unmount();
  });

  it('detaches on unmount', () => {
    const onTimeout = vi.fn();
    const { wrapper } = host({ timeoutSeconds: 10, warningSeconds: 5, onTimeout });

    wrapper.unmount();
    idle(60);

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
