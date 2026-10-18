/*
 * Pure logic for ScheduleEditor: an end-user schedule that is either a single
 * date-time or a recurring cron expression, without the user ever reading or
 * writing cron.
 *
 * The value is `{ start?, cron?, end? }`. A once-off (or "now") schedule is
 * `{ start }` alone; a recurring schedule is `{ cron, start, end? }`. `start`
 * is a local `yyyy-mm-ddTHH:mm` (the DateTimePicker shape), `end` a local
 * `yyyy-mm-dd` — cron cannot carry either date, which is why the value is an
 * object and not a bare string.
 *
 * DIALECT CONTRACT: every expression buildScheduleCron can emit must parse in
 * Cronos (the .NET package the backend schedules with), Croner (occurrence
 * preview) and cronstrue (prose). That intersection is: numbers, lists,
 * ranges, `*`, step suffixes, `L` in day-of-month, and `dL` / `d#n` (n 1–5)
 * in day-of-week. Never `?`, `W` specials, `#L`, weekday names, a seconds
 * field, or `7` for Sunday — and never day-of-month and day-of-week
 * restricted in the same expression, because both Cronos and Croner apply
 * Vixie OR semantics to that pair. If a consuming service parses with Cronos
 * `CronFormat.IncludeSeconds`, it must prepend `0 ` to the five-field value.
 *
 * The recurrence menu is deliberately cron-clean: hour intervals are divisors
 * of 24 (so stepped hours run evenly spaced), month intervals divisors of 12
 * emitted as a month list anchored at the start month (so the pattern wraps
 * evenly year to year), weekly is interval 1 with a weekday set. "Every N
 * days" and "every N weeks" are not offered because cron cannot express
 * them — a stepped day-of-month resets at each month boundary and week
 * parity is outside the grammar entirely.
 */

import {
  describeCron,
  formatSimpleList,
  isValidCron,
  nextOccurrences,
  parseSimpleList,
  splitCron,
} from '../components/cron';
import { splitDateTime } from './dateTime';

export interface ScheduleValue {
  /** First (or only) run, local `yyyy-mm-ddTHH:mm`. */
  start?: string;
  /** Five-field cron expression. Present only for recurring schedules. */
  cron?: string;
  /** Last day the schedule may run, inclusive, local `yyyy-mm-dd`. */
  end?: string;
}

export type ScheduleMode = 'now' | 'once' | 'recurring';
export type RecurrenceUnit = 'hour' | 'day' | 'week' | 'month';
export type MonthlyStyle = 'dayOfMonth' | 'nthWeekday';
export type NthWeek = 'first' | 'last';

export interface ScheduleDraft {
  mode: ScheduleMode;
  /** Local `yyyy-mm-ddTHH:mm`. Supplies the time of day for every recurrence. */
  start?: string;
  unit: RecurrenceUnit;
  /** Divisor of 24, so stepped hours are evenly spaced. */
  hourInterval: number;
  /** Divisor of 12, emitted as a month list anchored at the start month. */
  monthInterval: number;
  /** Selected weekdays (0 = Sunday … 6 = Saturday). Weekly only. */
  weekdays: number[];
  monthlyStyle: MonthlyStyle;
  /** Calendar day 1–31, or `L` for the last day of the month. */
  dayOfMonth: number | 'L';
  nthWeek: NthWeek;
  /** 0 = Sunday … 6 = Saturday. */
  nthWeekday: number;
  hasEnd: boolean;
  /** Local `yyyy-mm-dd`, inclusive. */
  end?: string;
  /**
   * Set when the incoming cron is valid but not one of the shapes the
   * controls round-trip. The original value is passed through untouched so
   * merely opening the editor never rewrites a schedule created elsewhere.
   */
  foreign?: ScheduleValue;
}

export const HOUR_INTERVALS: readonly number[] = [1, 2, 3, 4, 6, 8, 12];
export const MONTH_INTERVALS: readonly number[] = [1, 2, 3, 4, 6, 12];

/** Local wall-clock `yyyy-mm-ddTHH:mm` for a Date. */
export function toLocalDateTime(when: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T${pad(when.getHours())}:${pad(when.getMinutes())}`;
}

export function defaultDraft(now: Date = new Date()): ScheduleDraft {
  return {
    mode: 'now',
    start: undefined,
    unit: 'week',
    hourInterval: 1,
    monthInterval: 1,
    weekdays: [now.getDay()],
    monthlyStyle: 'dayOfMonth',
    dayOfMonth: now.getDate(),
    nthWeek: 'first',
    nthWeekday: now.getDay(),
    hasEnd: false,
    end: undefined,
  };
}

interface StartParts {
  minute: number;
  hour: number;
  month: number;
}

function startParts(start: string | undefined): StartParts | null {
  const { date, time } = splitDateTime(start);
  if (!date || !time) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})/.exec(time);
  if (!dateMatch || !timeMatch) return null;
  return {
    minute: Number(timeMatch[2]),
    hour: Number(timeMatch[1]),
    month: Number(dateMatch[2]),
  };
}

/**
 * Month field for an every-N-months recurrence anchored at the start month:
 * start March, every 3 months → `3,6,9,12`. Interval 1 is every month (`*`).
 */
function monthField(startMonth: number, interval: number): string {
  if (interval === 1) return '*';
  const months: number[] = [];
  for (let m = startMonth; months.length < 12 / interval; m += interval) {
    months.push(((m - 1) % 12) + 1);
  }
  return formatSimpleList(months);
}

/** 7 and 0 are both Sunday; collapse to 0 per the dialect contract. */
function normalizeWeekdays(values: number[]): number[] {
  return [...new Set(values.map((n) => (n === 7 ? 0 : n)))].filter((n) => n >= 0 && n <= 6).sort((a, b) => a - b);
}

/**
 * Draft → five-field cron, or null while the draft cannot produce one
 * (missing start, no weekdays). Time of day comes from the start.
 */
export function buildScheduleCron(draft: ScheduleDraft): string | null {
  const parts = startParts(draft.start);
  if (!parts) return null;
  const { minute, hour, month } = parts;

  switch (draft.unit) {
    case 'hour':
      return draft.hourInterval === 1 ? `${minute} * * * *` : `${minute} */${draft.hourInterval} * * *`;
    case 'day':
      return `${minute} ${hour} * * *`;
    case 'week': {
      const days = normalizeWeekdays(draft.weekdays);
      if (days.length === 0) return null;
      // All seven days is every day — same schedule, simpler expression.
      const dow = days.length === 7 ? '*' : formatSimpleList(days);
      return `${minute} ${hour} * * ${dow}`;
    }
    case 'month': {
      const months = monthField(month, draft.monthInterval);
      if (draft.monthlyStyle === 'dayOfMonth') {
        const dom = draft.dayOfMonth;
        if (typeof dom === 'number' && (dom < 1 || dom > 31)) return null;
        return `${minute} ${hour} ${dom} ${months} *`;
      }
      const day = draft.nthWeekday === 7 ? 0 : draft.nthWeekday;
      const dow = draft.nthWeek === 'first' ? `${day}#1` : `${day}L`;
      return `${minute} ${hour} * ${months} ${dow}`;
    }
    default:
      return null;
  }
}

export type RecurrenceFields = Pick<
  ScheduleDraft,
  'unit' | 'hourInterval' | 'monthInterval' | 'weekdays' | 'monthlyStyle' | 'dayOfMonth' | 'nthWeek' | 'nthWeekday'
>;

/**
 * Recognises the shapes buildScheduleCron emits, so an incoming value opens
 * with the controls set rather than as a foreign schedule. Null for anything
 * else — approximating would rewrite the expression on the next edit.
 */
export function detectRecurrence(expr: string): RecurrenceFields | null {
  if (!isValidCron(expr)) return null;
  const parts = splitCron(expr);
  if (!parts || parts.second !== '') return null;

  const base: RecurrenceFields = {
    unit: 'day',
    hourInterval: 1,
    monthInterval: 1,
    weekdays: [],
    monthlyStyle: 'dayOfMonth',
    dayOfMonth: 1,
    nthWeek: 'first',
    nthWeekday: 1,
  };

  if (!/^\d{1,2}$/.test(parts.minute)) return null;

  // Every N hours: `M */N * * *` (or `M * * * *` for every hour).
  if (parts.hour === '*' || /^\*\/\d{1,2}$/.test(parts.hour)) {
    if (parts.dayOfMonth !== '*' || parts.month !== '*' || parts.dayOfWeek !== '*') return null;
    const interval = parts.hour === '*' ? 1 : Number(parts.hour.slice(2));
    if (!HOUR_INTERVALS.includes(interval)) return null;
    return { ...base, unit: 'hour', hourInterval: interval };
  }

  if (!/^\d{1,2}$/.test(parts.hour)) return null;

  const monthInterval = detectMonthInterval(parts.month);

  // Daily / weekly never restrict the month — a month list means monthly.
  if (parts.dayOfMonth === '*' && parts.month === '*') {
    if (parts.dayOfWeek === '*') return { ...base, unit: 'day' };
    const days = parseSimpleList(parts.dayOfWeek, 0, 7);
    if (days !== null) {
      const weekdays = normalizeWeekdays(days);
      if (weekdays.length === 7) return { ...base, unit: 'day' };
      if (weekdays.length > 0) return { ...base, unit: 'week', weekdays };
    }
  }

  if (monthInterval === null) return null;

  // Monthly on a day of month: `M H <D|L> <months> *`.
  if (parts.dayOfWeek === '*') {
    let dayOfMonth: number | 'L';
    if (parts.dayOfMonth.toUpperCase() === 'L') dayOfMonth = 'L';
    else if (/^\d{1,2}$/.test(parts.dayOfMonth) && Number(parts.dayOfMonth) >= 1 && Number(parts.dayOfMonth) <= 31) {
      dayOfMonth = Number(parts.dayOfMonth);
    } else return null;
    return { ...base, unit: 'month', monthInterval, dayOfMonth };
  }

  // Monthly on the first/last weekday: `M H * <months> <d#1|dL>`.
  if (parts.dayOfMonth !== '*') return null;
  const first = /^([0-7])#1$/.exec(parts.dayOfWeek);
  const last = /^([0-7])L$/i.exec(parts.dayOfWeek);
  const match = first ?? last;
  if (!match) return null;
  const day = Number(match[1]);
  return {
    ...base,
    unit: 'month',
    monthInterval,
    monthlyStyle: 'nthWeekday',
    nthWeek: first ? 'first' : 'last',
    nthWeekday: day === 7 ? 0 : day,
  };
}

/**
 * A month list is an interval when it is evenly spaced and covers the year:
 * `3,6,9,12` → every 3 months. `*` is every month. Null otherwise.
 */
function detectMonthInterval(raw: string): number | null {
  if (raw === '*') return 1;
  const months = parseSimpleList(raw, 1, 12);
  if (months === null || months.length === 0) return null;
  const interval = 12 / months.length;
  if (!MONTH_INTERVALS.includes(interval)) return null;
  for (let i = 1; i < months.length; i++) {
    if (months[i]! - months[i - 1]! !== interval) return null;
  }
  return interval;
}

/** First problem in reading order, or null when the draft is complete. */
export function scheduleProblem(draft: ScheduleDraft): string | null {
  if (draft.mode === 'now') return null;
  if (draft.mode === 'recurring' && draft.foreign) return null;

  if (!draft.start) {
    return draft.mode === 'once' ? 'Pick a date and time.' : 'Pick a start date and time.';
  }

  if (draft.mode === 'once') return null;

  if (draft.unit === 'week' && normalizeWeekdays(draft.weekdays).length === 0) {
    return 'Pick at least one day of the week.';
  }

  if (draft.hasEnd) {
    if (!draft.end) return 'Pick an end date.';
    const startDate = splitDateTime(draft.start).date;
    if (startDate && draft.end < startDate) return 'The end date is before the start.';
  }

  return null;
}

/**
 * Draft → model value. Undefined while the draft is incomplete — the field
 * reports the gap through scheduleProblem instead of emitting a half-truth.
 */
export function draftToValue(draft: ScheduleDraft): ScheduleValue | undefined {
  if (draft.mode === 'now' || draft.mode === 'once') {
    return draft.start ? { start: draft.start } : undefined;
  }

  // A foreign schedule passes through untouched until the user replaces it.
  if (draft.foreign) return { ...draft.foreign };

  if (scheduleProblem(draft) !== null) return undefined;
  const cron = buildScheduleCron(draft);
  if (cron === null || !draft.start) return undefined;

  const value: ScheduleValue = { start: draft.start, cron };
  if (draft.hasEnd && draft.end) value.end = draft.end;
  return value;
}

/**
 * Model value → draft. `previous` preserves state the value cannot carry —
 * which branch of Now/Later a bare `{ start }` came from, and untouched
 * settings on the branches the user is not currently on.
 */
export function valueToDraft(value: ScheduleValue | undefined, previous?: ScheduleDraft): ScheduleDraft {
  if (!value || (!value.start && !value.cron)) return defaultDraft();

  if (value.cron) {
    const draft: ScheduleDraft = {
      ...(previous ?? defaultDraft()),
      mode: 'recurring',
      start: value.start,
      hasEnd: value.end !== undefined,
      end: value.end,
      foreign: undefined,
    };

    const recurrence = value.start ? detectRecurrence(value.cron) : null;
    if (recurrence) {
      Object.assign(draft, recurrence);
      // Round-trip equality is the acceptance test: if rebuilding from the
      // draft would change the expression (a month list anchored elsewhere,
      // a different minute), the value is foreign — never approximated.
      if (buildScheduleCron(draft) === value.cron) return draft;
    }

    draft.foreign = { ...value };
    return draft;
  }

  const mode: ScheduleMode = previous && previous.mode === 'now' && previous.start === value.start ? 'now' : 'once';
  return { ...(previous ?? defaultDraft()), mode, start: value.start, foreign: undefined };
}

/** Property-wise equality; `{}` and undefined both mean "no schedule". */
export function scheduleValuesEqual(a: ScheduleValue | undefined, b: ScheduleValue | undefined): boolean {
  return a?.start === b?.start && a?.cron === b?.cron && a?.end === b?.end;
}

/** `Mon, 11 Aug 2026, 14:30` — matches the CronEditor occurrence format. */
export function formatScheduleDateTime(value: string | Date | undefined): string {
  if (value === undefined) return '';
  const when = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatScheduleDate(date: string): string {
  const when = new Date(`${date}T00:00`);
  if (Number.isNaN(when.getTime())) return date;
  return when.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Whole-value prose: what runs, when it starts, and when it stops. */
export function describeSchedule(value: ScheduleValue | undefined): string {
  if (!value) return '';

  if (!value.cron) {
    return value.start ? `Once, on ${formatScheduleDateTime(value.start)}.` : '';
  }

  const prose = describeCron(value.cron);
  if (prose === '') return '';

  let text = prose.replace(/[.!?]$/, '');
  if (value.start) text += `, from ${formatScheduleDateTime(value.start)}`;
  text += value.end ? `, until ${formatScheduleDate(value.end)}.` : '.';
  return text;
}

/**
 * Next fire times bounded by the schedule window: never before `start`,
 * never after the end of the `end` day. May return fewer than `count` when
 * the schedule expires first.
 */
export function occurrencesBetween(
  cron: string,
  start?: string,
  end?: string,
  count = 5,
  from: Date = new Date(),
): Date[] {
  let floor = from;
  if (start) {
    // A run exactly at the start instant counts, so step just behind it.
    const startsAt = new Date(start);
    if (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() - 1000 > floor.getTime()) {
      floor = new Date(startsAt.getTime() - 1000);
    }
  }

  const runs = nextOccurrences(cron, count, floor);
  if (!end) return runs;

  const limit = new Date(`${end}T23:59:59`);
  if (Number.isNaN(limit.getTime())) return runs;
  return runs.filter((run) => run.getTime() <= limit.getTime());
}

/**
 * True when a complete schedule can never fire at or after `from`: a once-off
 * whose date-time has passed, or a recurring window that closes before the
 * next occurrence would fire. False for absent or incomplete values — "will
 * never run" is a statement about a schedule, not about the lack of one. Pass
 * a minute-floored `from` (the `useClock('minute')` value) so a start in the
 * current minute still counts as upcoming.
 */
export function scheduleNeverRuns(value: ScheduleValue | undefined, from: Date = new Date()): boolean {
  if (!value) return false;

  if (value.cron) {
    if (!isValidCron(value.cron)) return false;
    return occurrencesBetween(value.cron, value.start, value.end, 1, from).length === 0;
  }

  if (!value.start) return false;
  const startsAt = new Date(value.start);
  if (Number.isNaN(startsAt.getTime())) return false;
  return startsAt.getTime() < from.getTime();
}
