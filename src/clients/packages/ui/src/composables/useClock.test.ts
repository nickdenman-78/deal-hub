import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, watch, type ShallowRef } from 'vue';
import { __resetClockForTests, nextBoundary, startOf, useClock, type ClockGranularity } from './useClock';

/*
 * The resource guarantees asserted below ARE the design: one boundary-aligned
 * timeout for the whole app (never a 1s interval per subscriber), no timer at
 * all without subscribers, and one ref write per boundary crossing even after
 * a multi-day sleep. A re-implementation that "just uses setInterval(1000)"
 * passes a smoke test and fails every one of these.
 */
function host(granularity: ClockGranularity) {
  let clock!: Readonly<ShallowRef<Date>>;
  const wrapper = mount(
    defineComponent({
      setup() {
        clock = useClock(granularity);
        return () => h('div');
      },
    }),
  );
  return { wrapper, clock };
}

beforeEach(() => {
  vi.useFakeTimers();
  // Date.now() must move with the timers: the clock derives every period from
  // wall-clock truncation rather than counting ticks.
  vi.setSystemTime(new Date(2026, 0, 1, 10, 0, 30));
  __resetClockForTests();
});

afterEach(() => vi.useRealTimers());

describe('useClock', () => {
  it('primes to the start of the current period and emits on the boundary', () => {
    const { wrapper, clock } = host('minute');

    expect(clock.value).toEqual(new Date(2026, 0, 1, 10, 0, 0));

    vi.advanceTimersByTime(29_000);
    expect(clock.value).toEqual(new Date(2026, 0, 1, 10, 0, 0));

    vi.advanceTimersByTime(1_100); // across 10:01:00 (+ scheduling fudge)
    expect(clock.value).toEqual(new Date(2026, 0, 1, 10, 1, 0));

    wrapper.unmount();
  });

  it('schedules ONE boundary-aligned timeout, not a per-second interval', () => {
    const { wrapper } = host('minute');

    expect(vi.getTimerCount()).toBe(1);

    // The single pending timer lands at (or a few ms past) the minute
    // boundary — a 1s cadence would land at 10:00:31.
    vi.advanceTimersToNextTimer();
    const now = Date.now();
    const boundary = new Date(2026, 0, 1, 10, 1, 0).getTime();
    expect(now).toBeGreaterThanOrEqual(boundary);
    expect(now).toBeLessThan(boundary + 50);

    wrapper.unmount();
  });

  it('writes each granularity once per crossing — a second subscriber does not fan out to minute dependents', () => {
    const seconds = host('second');
    const minutes = host('minute');
    // flush: 'sync' — default (async) flushing would coalesce every write into
    // one post-advance callback and hide the fan-out behaviour under test.
    const secondWrites = vi.fn();
    const minuteWrites = vi.fn();
    watch(seconds.clock, secondWrites, { flush: 'sync' });
    watch(minutes.clock, minuteWrites, { flush: 'sync' });

    vi.advanceTimersByTime(60_000);

    expect(secondWrites.mock.calls.length).toBeGreaterThanOrEqual(59);
    expect(secondWrites.mock.calls.length).toBeLessThanOrEqual(61);
    expect(minuteWrites).toHaveBeenCalledTimes(1);

    seconds.wrapper.unmount();
    minutes.wrapper.unmount();
  });

  it('stops the timer when the last subscriber unmounts and re-primes on remount', () => {
    const first = host('minute');
    first.wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);

    // A long time passes with no subscribers — nothing runs, nothing accrues.
    vi.setSystemTime(new Date(2026, 0, 3, 15, 42, 10));

    const second = host('minute');
    expect(vi.getTimerCount()).toBe(1);
    // Not the stale period from the first run.
    expect(second.clock.value).toEqual(new Date(2026, 0, 3, 15, 42, 0));

    second.wrapper.unmount();
  });

  it('upgrades the cadence when a finer subscriber mounts, and downgrades when it leaves', () => {
    const minutes = host('minute');

    // Minute-only: next wake is the minute boundary, 30s out.
    vi.advanceTimersToNextTimer();
    expect(new Date(Date.now()).getSeconds()).toBe(0);

    // A seconds subscriber arrives: next wake is ≤1s out.
    const seconds = host('second');
    const before = Date.now();
    vi.advanceTimersToNextTimer();
    expect(Date.now() - before).toBeLessThanOrEqual(1_005);

    // It leaves: the pending wake is back on the minute boundary.
    seconds.wrapper.unmount();
    vi.advanceTimersToNextTimer();
    expect(new Date(Date.now()).getSeconds()).toBe(0);
    expect(new Date(Date.now()).getMilliseconds()).toBeLessThan(50);

    minutes.wrapper.unmount();
  });

  it('emits each crossed boundary exactly once after a multi-day sleep', () => {
    const minutes = host('minute');
    const days = host('day');
    const minuteWrites = vi.fn();
    const dayWrites = vi.fn();
    watch(minutes.clock, minuteWrites, { flush: 'sync' });
    watch(days.clock, dayWrites, { flush: 'sync' });

    // The machine sleeps for three days; the pending timeout fires late.
    vi.setSystemTime(new Date(2026, 0, 4, 0, 0, 5));
    vi.advanceTimersToNextTimer();

    expect(minuteWrites).toHaveBeenCalledTimes(1);
    expect(dayWrites).toHaveBeenCalledTimes(1);
    expect(days.clock.value).toEqual(new Date(2026, 0, 4));
    expect(minutes.clock.value).toEqual(new Date(2026, 0, 4, 0, 0, 0));

    minutes.wrapper.unmount();
    days.wrapper.unmount();
  });

  it('catches up immediately when a hidden tab becomes visible again', () => {
    const { wrapper, clock } = host('minute');

    // Time jumps (throttled tab) without any timer firing.
    vi.setSystemTime(new Date(2026, 0, 1, 11, 30, 2));
    expect(clock.value).toEqual(new Date(2026, 0, 1, 10, 0, 0));

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(clock.value).toEqual(new Date(2026, 0, 1, 11, 30, 0));

    wrapper.unmount();
  });

  it('changes the day at local midnight', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 23, 59, 59, 500));
    const { wrapper, clock } = host('day');

    expect(clock.value).toEqual(new Date(2026, 0, 1));

    vi.advanceTimersByTime(600);
    expect(clock.value).toEqual(new Date(2026, 0, 2));

    wrapper.unmount();
  });

  it('follows a system clock set backwards', () => {
    const { wrapper, clock } = host('minute');

    vi.setSystemTime(new Date(2026, 0, 1, 9, 15, 10));
    vi.advanceTimersToNextTimer();

    expect(clock.value).toEqual(new Date(2026, 0, 1, 9, 15, 0));

    wrapper.unmount();
  });

  it('warns (but keeps working) outside an effect scope', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const clock = useClock('minute');
    expect(clock.value).toEqual(new Date(2026, 0, 1, 10, 0, 0));
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
    __resetClockForTests(); // the scopeless subscription can never release itself
  });
});

/*
 * DST behaviour is tested on the pure helpers rather than with fake timers:
 * driving the environment timezone is brittle on Windows CI, and the sleep
 * catch-up test above already proves that a mis-scheduled wake self-corrects
 * via wall-clock truncation.
 */
describe('boundary helpers', () => {
  it('startOf truncates each granularity', () => {
    const d = new Date(2026, 5, 15, 14, 35, 42, 123);
    expect(startOf(d, 'second')).toEqual(new Date(2026, 5, 15, 14, 35, 42));
    expect(startOf(d, 'minute')).toEqual(new Date(2026, 5, 15, 14, 35, 0));
    expect(startOf(d, 'hour')).toEqual(new Date(2026, 5, 15, 14, 0, 0));
    expect(startOf(d, 'day')).toEqual(new Date(2026, 5, 15));
  });

  it('nextBoundary(day) uses calendar rollover, so month/year edges hold', () => {
    expect(nextBoundary(new Date(2026, 11, 31, 18, 0, 0), 'day')).toEqual(new Date(2027, 0, 1));
    expect(nextBoundary(new Date(2026, 1, 28, 6, 0, 0), 'day')).toEqual(new Date(2026, 2, 1));
  });

  it('nextBoundary lands on the next period start, never the current one', () => {
    const onBoundary = new Date(2026, 5, 15, 14, 0, 0, 0);
    expect(nextBoundary(onBoundary, 'hour')).toEqual(new Date(2026, 5, 15, 15, 0, 0));
    expect(nextBoundary(onBoundary, 'second')).toEqual(new Date(2026, 5, 15, 14, 0, 1));
  });

  it('day boundaries across a NEM DST transition are consecutive local midnights', () => {
    // 2026-04-05 is the AEDT→AEST fall-back (a 25h day) in NSW/VIC/SA/TAS.
    // Whatever timezone the test host runs in, three facts must hold: the next
    // day boundary is the next calendar date, at local midnight, strictly after
    // the current one in epoch terms.
    const d = new Date(2026, 3, 4, 22, 0, 0);
    const next = nextBoundary(d, 'day');
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(3);
    expect(next.getDate()).toBe(5);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getTime()).toBeGreaterThan(d.getTime());
  });
});
