import { getCurrentScope, onScopeDispose, shallowReadonly, shallowRef, type ShallowRef } from 'vue';

/**
 * How often a subscriber wants to hear about the passage of time. Each
 * granularity's ref is written exactly once per boundary crossing — a `minute`
 * subscriber's dependents re-run once per minute even while a `second`
 * subscriber elsewhere keeps the shared timer at 1s cadence.
 */
export type ClockGranularity = 'second' | 'minute' | 'hour' | 'day';

// Coarse → fine. sync() walks this order; finest() scans it from the end.
const GRANULARITIES = ['day', 'hour', 'minute', 'second'] as const;

/*
 * Module-scoped singleton rather than per-call state. Wall-clock time is global
 * by nature — a second independent timer could only ever tick the same seconds
 * twice. One refcounted timeout serves every subscriber in the app, aligned to
 * the next boundary of the finest granularity anyone is listening to: a page
 * whose only subscriber is a HH:mm clock wakes once per minute, and a page with
 * no subscribers runs no timer at all.
 *
 * Ticks are never counted. Every wake re-derives each granularity's period
 * start from Date.now(), so background-tab throttling (~1 wake/min) and laptop
 * sleep resolve to one late wake that emits each crossed boundary exactly once
 * — a three-day sleep writes `day` once, not three times. The visibilitychange
 * listener only makes that catch-up immediate when a hidden tab returns; the
 * late-firing stale timeout covers sleep with the tab still visible.
 */
const refs: Record<ClockGranularity, ShallowRef<Date>> = {
  second: shallowRef(new Date(0)),
  minute: shallowRef(new Date(0)),
  hour: shallowRef(new Date(0)),
  day: shallowRef(new Date(0)),
};
const counts: Record<ClockGranularity, number> = { second: 0, minute: 0, hour: 0, day: 0 };
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let visibilityListenerAttached = false;

/**
 * Truncates to the start of the period containing `date` — start of second,
 * start of minute, top of the hour, or local midnight. Mutation-based
 * (`setHours(0,0,0,0)` and friends) rather than field construction, because
 * mutating an existing instant is unambiguous inside a DST fall-back repeated
 * hour where `new Date(y, m, d, h)` is not. Exported for direct DST tests; not
 * part of the barrel surface.
 */
export function startOf(date: Date, granularity: ClockGranularity): Date {
  const t = new Date(date.getTime());
  switch (granularity) {
    case 'second':
      t.setMilliseconds(0);
      break;
    case 'minute':
      t.setSeconds(0, 0);
      break;
    case 'hour':
      t.setMinutes(0, 0, 0);
      break;
    case 'day':
      t.setHours(0, 0, 0, 0);
      break;
  }
  return t;
}

/**
 * The first instant of the next period after `date`. The day step uses
 * constructor field rollover rather than +24h, so DST-shortened (23h) and
 * -lengthened (25h) days still land on the next local midnight. Sub-day steps
 * add the nominal period; if a half-hour DST shift ever puts one wake off the
 * local grid, sync-on-wake truncates from Date.now() and the next reschedule
 * is back on it. Exported for direct DST tests; not part of the barrel surface.
 */
export function nextBoundary(date: Date, granularity: ClockGranularity): Date {
  const t = startOf(date, granularity);
  switch (granularity) {
    case 'second':
      return new Date(t.getTime() + 1000);
    case 'minute':
      return new Date(t.getTime() + 60_000);
    case 'hour':
      return new Date(t.getTime() + 3_600_000);
    case 'day':
      return new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  }
}

function finest(): ClockGranularity | null {
  for (let i = GRANULARITIES.length - 1; i >= 0; i--) {
    if (counts[GRANULARITIES[i]] > 0) return GRANULARITIES[i];
  }
  return null;
}

/*
 * Writes every subscribed granularity whose period has changed since its ref
 * was last written. Compares with !== rather than >, so a system clock set
 * backwards is followed too. In a DST fall-back the repeated local hour has a
 * different epoch, so `hour` re-emits — correct, it genuinely is a new
 * hour-long period.
 */
function sync(): void {
  const now = new Date();
  for (const g of GRANULARITIES) {
    if (counts[g] === 0) continue;
    const t = startOf(now, g);
    if (t.getTime() !== refs[g].value.getTime()) {
      refs[g].value = t;
    }
  }
}

function onVisible(): void {
  if (document.visibilityState === 'visible') wake();
}

function reschedule(): void {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  const g = finest();
  // jsdom/SSR guard: refs still hold valid Dates from priming, there is simply
  // no timer to advance them.
  if (g === null || typeof window === 'undefined') {
    if (visibilityListenerAttached) {
      document.removeEventListener('visibilitychange', onVisible);
      visibilityListenerAttached = false;
    }
    return;
  }

  if (!visibilityListenerAttached) {
    document.addEventListener('visibilitychange', onVisible);
    visibilityListenerAttached = true;
  }

  // +5ms fudge: timer clamping may fire a hair early, and firing just before
  // the boundary would truncate to the old period and schedule a zero-delay
  // retry loop right at the crossing.
  const delay = nextBoundary(new Date(), g).getTime() - Date.now();
  timeoutId = setTimeout(wake, Math.max(delay, 1) + 5);
}

function wake(): void {
  sync();
  reschedule();
}

/**
 * Subscribe to the shared wall clock. The returned ref holds the START of the
 * current period (start of minute, local midnight, …) and is written exactly
 * once per boundary crossing — `watch` it for a callback, or use it in a
 * `computed` that should follow the clock:
 *
 * ```ts
 * const minute = useClock('minute');
 * const hhmm = computed(() =>
 *   minute.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
 * ```
 *
 * Call during component setup (or inside an effect scope); the subscription is
 * released automatically when the scope is disposed, and the underlying timer
 * stops entirely once no subscribers remain.
 */
export function useClock(granularity: ClockGranularity): Readonly<ShallowRef<Date>> {
  // First subscriber for this granularity: prime the ref before anyone reads
  // it, so a remount never sees a stale period left over from an earlier run.
  if (counts[granularity] === 0) {
    refs[granularity].value = startOf(new Date(), granularity);
  }
  counts[granularity]++;
  reschedule();

  if (getCurrentScope()) {
    onScopeDispose(() => {
      counts[granularity]--;
      reschedule();
    });
  } else if (import.meta.env.DEV) {
    console.warn(
      '[useClock] called outside an effect scope — the subscription can never be released, so the clock timer will run for the lifetime of the page.',
    );
  }

  // shallowReadonly, not readonly: a deep readonly proxy wraps the Date itself,
  // and Date methods throw when invoked on a proxy receiver.
  return shallowReadonly(refs[granularity]);
}

/** Test seam — kills the timer and zeroes the refcounts between test cases. */
export function __resetClockForTests(): void {
  for (const g of GRANULARITIES) {
    counts[g] = 0;
    refs[g].value = new Date(0);
  }
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  if (visibilityListenerAttached) {
    document.removeEventListener('visibilitychange', onVisible);
    visibilityListenerAttached = false;
  }
}
