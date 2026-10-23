/*
 * Five- or six-field cron parsing, building and description. Pure, so the
 * parts worth getting right are testable without mounting the editor.
 *
 * Standard five-field cron — minute, hour, day-of-month, month, day-of-week —
 * plus an optional leading seconds field (Cronos `IncludeSeconds`, which the
 * backend already runs). Day-of-month also accepts Cronos extensions (`L`,
 * `LW`, `L-n`, `nW`); day-of-week accepts `dL` (last <weekday>) and `d#n`
 * (nth <weekday>). No @reboot-style macros.
 *
 * Human-readable prose is delegated to cronstrue — a half-written descriptor
 * that is right for some expressions and subtly wrong for others is worse than
 * a library that covers the whole dialect.
 */

import { Cron } from 'croner';
import cronstrue from 'cronstrue';

export const CRON_PRESETS = ['minutely', 'hourly', 'daily', 'weekly', 'monthly', 'custom'] as const;
export type CronPreset = (typeof CRON_PRESETS)[number];

/**
 * Day-of-month value the monthly controls can round-trip: a calendar day
 * (1–31) or a Cronos special (`L`, `LW`, `L-1`, `15W`, …).
 */
export type DayOfMonthValue = number | string;

export interface CronParts {
  /**
   * Leading seconds field. Empty string means a five-field expression; any
   * other value is written as the first of six fields.
   */
  second: string;
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface CronShape {
  preset: CronPreset;
  /** Populated for whichever preset uses them. */
  minute: number;
  hour: number;
  /** Selected weekdays (0 = Sunday … 6 = Saturday). Weekly only. */
  daysOfWeek: number[];
  dayOfMonth: DayOfMonthValue;
  /**
   * Selected months (1–12). Empty means every month (`*`). Used by daily,
   * weekly and monthly — the controls that can sensibly restrict by calendar
   * month without becoming a different frequency.
   */
  months: number[];
}

/**
 * Special day-of-month tokens offered in the monthly picker. Cronos accepts
 * these as a single field value (not mixed into a comma list with numbers).
 */
export const DAY_OF_MONTH_SPECIALS = [
  { value: 'L', label: 'Last day of the month' },
  { value: 'LW', label: 'Last weekday of the month' },
  { value: 'L-1', label: 'Day before last' },
  { value: 'L-2', label: 'Two days before last' },
  { value: '1W', label: 'Weekday nearest the 1st' },
  { value: '15W', label: 'Weekday nearest the 15th' },
] as const;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

interface FieldSpec {
  min: number;
  max: number;
  name: string;
}

const FIELDS: readonly FieldSpec[] = [
  { min: 0, max: 59, name: 'minute' },
  { min: 0, max: 23, name: 'hour' },
  { min: 1, max: 31, name: 'day-of-month' },
  { min: 1, max: 12, name: 'month' },
  // 7 is Sunday as well as 0 — standard cron accepts both, and rejecting 7
  // would fail expressions copied straight out of a working crontab.
  { min: 0, max: 7, name: 'day-of-week' },
];

const SECOND_FIELD: FieldSpec = { min: 0, max: 59, name: 'second' };

/**
 * Splits into five or six fields. Six-field form is seconds-first (Cronos).
 * Returns null for any other arity.
 */
export function splitCron(expr: string | null | undefined): CronParts | null {
  if (typeof expr !== 'string') return null;
  const parts = expr.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 5) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [string, string, string, string, string];
    return { second: '', minute, hour, dayOfMonth, month, dayOfWeek };
  }
  if (parts.length === 6) {
    const [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    return { second, minute, hour, dayOfMonth, month, dayOfWeek };
  }
  return null;
}

/**
 * Validates one field: `*`, `n`, `a-b`, a comma list of those, and a `/step`
 * suffix on any of them.
 */
function isValidField(raw: string, spec: FieldSpec): boolean {
  if (raw === '') return false;

  return raw.split(',').every((term) => {
    if (term === '') return false;

    const [range, step, ...rest] = term.split('/');
    if (rest.length > 0 || range === undefined) return false;

    if (step !== undefined) {
      if (!/^\d+$/.test(step)) return false;
      // `*/0` is an infinite loop expressed as a schedule. Some daemons reject
      // it, some run every unit; neither is what anyone meant.
      if (Number(step) === 0) return false;
    }

    if (range === '*') return true;

    const bounds = range.split('-');
    if (bounds.length > 2) return false;

    return bounds.every((bound) => {
      if (!/^\d+$/.test(bound)) return false;
      const value = Number(bound);
      return value >= spec.min && value <= spec.max;
    });
  });
}

/**
 * Cronos day-of-month specials: `L`, `LW`, `L-n`, `L-nW`, `nW`. These must be
 * the whole field — Cronos rejects mixing them with numeric lists.
 */
function isValidDayOfMonthSpecial(raw: string): boolean {
  const upper = raw.toUpperCase();
  if (upper === 'L' || upper === 'LW') return true;

  const lastOffset = /^L-(\d{1,2})(W)?$/.exec(upper);
  if (lastOffset) {
    const offset = Number(lastOffset[1]);
    return offset >= 1 && offset <= 30;
  }

  const nearest = /^(\d{1,2})W$/.exec(upper);
  if (nearest) {
    const day = Number(nearest[1]);
    return day >= 1 && day <= 31;
  }

  return false;
}

function isValidDayOfMonth(raw: string): boolean {
  // A leading L or a trailing W marks a Cronos special. Anything else is the
  // numeric `* / n / a-b / list` grammar shared with the other fields.
  if (/^L/i.test(raw) || /W$/i.test(raw)) return isValidDayOfMonthSpecial(raw);
  return isValidField(raw, FIELDS[2]!);
}

/**
 * Day-of-week specials shared by Cronos and Croner: `dL` (last <weekday> of
 * the month) and `d#n` (nth <weekday>, n 1–5). Whole-field tokens, like the
 * day-of-month specials — Cronos rejects mixing them into comma lists, and
 * `d#L` renders as broken cronstrue prose, so neither form is accepted.
 */
function isValidDayOfWeekSpecial(raw: string): boolean {
  return /^[0-7]L$/i.test(raw) || /^[0-7]#[1-5]$/.test(raw);
}

function isValidDayOfWeek(raw: string): boolean {
  if (/[L#]/i.test(raw)) return isValidDayOfWeekSpecial(raw);
  return isValidField(raw, FIELDS[4]!);
}

/**
 * Parses a single day-of-month token the monthly controls can round-trip.
 * Returns null for `*`, lists, steps, or specials the picker does not model.
 */
export function parseDayOfMonthToken(raw: string): DayOfMonthValue | null {
  if (/^\d{1,2}$/.test(raw)) {
    const day = Number(raw);
    return day >= 1 && day <= 31 ? day : null;
  }

  const upper = raw.toUpperCase();
  if (DAY_OF_MONTH_SPECIALS.some((special) => special.value === upper)) return upper;

  // Offsets the picker does not list still round-trip as the literal token so
  // a hand-edited `L-3` is not silently rewritten to the 3rd of the month.
  if (/^L-\d{1,2}$/.test(upper)) {
    const offset = Number(upper.slice(2));
    return offset >= 1 && offset <= 30 ? upper : null;
  }
  if (/^\d{1,2}W$/.test(upper)) {
    const day = Number(upper.slice(0, -1));
    return day >= 1 && day <= 31 ? upper : null;
  }

  return null;
}

export function cronError(expr: string | null | undefined): string | null {
  const parts = splitCron(expr);
  if (!parts) {
    return 'A cron expression has five fields (minute hour day-of-month month day-of-week), or six with a leading seconds field.';
  }

  if (parts.second !== '') {
    if (!isValidField(parts.second, SECOND_FIELD)) {
      return `“${parts.second}” is not a valid second (0–59).`;
    }
  }

  const values = [parts.minute, parts.hour, parts.dayOfMonth, parts.month, parts.dayOfWeek];
  for (let i = 0; i < FIELDS.length; i++) {
    const spec = FIELDS[i];
    const value = values[i];
    if (!spec || value === undefined) continue;
    const ok =
      spec.name === 'day-of-month'
        ? isValidDayOfMonth(value)
        : spec.name === 'day-of-week'
          ? isValidDayOfWeek(value)
          : isValidField(value, spec);
    if (!ok) {
      if (spec.name === 'day-of-month') {
        return `“${value}” is not a valid day-of-month (1–31, L, LW, L-n, or nW).`;
      }
      if (spec.name === 'day-of-week') {
        return `“${value}” is not a valid day-of-week (0–7, dL, or d#1–5).`;
      }
      return `“${value}” is not a valid ${spec.name} (${spec.min}–${spec.max}).`;
    }
  }
  return null;
}

export function isValidCron(expr: string | null | undefined): boolean {
  return cronError(expr) === null;
}

/**
 * Parses `n`, `a-b`, and comma-lists of those into a sorted unique list.
 * Returns null for `*`, `/step`, or anything the visual controls cannot
 * round-trip — those stay Custom rather than being approximated.
 */
export function parseSimpleList(raw: string, min: number, max: number): number[] | null {
  if (raw === '' || raw === '*' || raw.includes('/')) return null;

  const out: number[] = [];
  for (const term of raw.split(',')) {
    if (term === '') return null;
    const bounds = term.split('-');
    if (bounds.length === 1) {
      const bound = bounds[0];
      if (bound === undefined || !/^\d+$/.test(bound)) return null;
      const n = Number(bound);
      if (n < min || n > max) return null;
      out.push(n);
      continue;
    }
    if (bounds.length !== 2) return null;
    const lo = bounds[0];
    const hi = bounds[1];
    if (lo === undefined || hi === undefined || !/^\d+$/.test(lo) || !/^\d+$/.test(hi)) return null;
    const a = Number(lo);
    const b = Number(hi);
    if (a < min || a > max || b < min || b > max || a > b) return null;
    for (let i = a; i <= b; i++) out.push(i);
  }

  return [...new Set(out)].sort((a, b) => a - b);
}

/**
 * Compacts a sorted unique list into cron form: consecutive runs become
 * `a-b`, gaps stay as commas. Empty yields `*` (every).
 */
export function formatSimpleList(values: number[]): string {
  if (values.length === 0) return '*';

  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0]!;
  let prev = start;

  for (let i = 1; i <= sorted.length; i++) {
    const next = sorted[i];
    if (next === prev + 1) {
      prev = next;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    if (next !== undefined) {
      start = next;
      prev = next;
    }
  }

  return parts.join(',');
}

/** Empty or all twelve months both mean every month in the editor. */
export function normalizeMonths(values: number[]): number[] {
  const unique = [...new Set(values)].filter((n) => n >= 1 && n <= 12).sort((a, b) => a - b);
  return unique.length === 12 ? [] : unique;
}

/** 7 and 0 are both Sunday; collapse to 0 so the weekday toggles have one Sunday. */
function normalizeDaysOfWeek(values: number[]): number[] {
  return [...new Set(values.map((n) => (n === 7 ? 0 : n)))].filter((n) => n >= 0 && n <= 6).sort((a, b) => a - b);
}

function parseMonthsField(raw: string): number[] | null {
  if (raw === '*') return [];
  const parsed = parseSimpleList(raw, 1, 12);
  return parsed === null ? null : normalizeMonths(parsed);
}

function parseDaysOfWeekField(raw: string): number[] | null {
  const parsed = parseSimpleList(raw, 0, 7);
  if (parsed === null || parsed.length === 0) return null;
  const days = normalizeDaysOfWeek(parsed);
  return days.length === 0 ? null : days;
}

const DEFAULT_SHAPE: CronShape = {
  preset: 'custom',
  minute: 0,
  hour: 9,
  daysOfWeek: [1],
  dayOfMonth: 1,
  months: [],
};

/**
 * Recognises the handful of shapes the visual controls can round-trip.
 *
 * Anything else is `custom` — deliberately, because a preset that only
 * approximates the expression would silently rewrite it the moment the
 * operator touched an unrelated control.
 */
export function detectShape(expr: string | null | undefined): CronShape {
  const parts = splitCron(expr);
  if (!parts || !isValidCron(expr)) return { ...DEFAULT_SHAPE };

  // Presets are five-field. A leading seconds value other than `0` (on the
  // second) is not something they round-trip, so stay Custom.
  if (parts.second !== '' && parts.second !== '0') {
    return { ...DEFAULT_SHAPE, preset: 'custom' };
  }

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;
  const num = (v: string) => (/^\d{1,2}$/.test(v) ? Number(v) : null);

  const everyDom = dayOfMonth === '*';
  const everyDow = dayOfWeek === '*';
  const months = parseMonthsField(month);
  if (months === null) return { ...DEFAULT_SHAPE, preset: 'custom' };

  if (minute === '*' && hour === '*' && everyDom && month === '*' && everyDow) {
    return { ...DEFAULT_SHAPE, preset: 'minutely' };
  }

  const m = num(minute);
  if (m !== null && hour === '*' && everyDom && month === '*' && everyDow) {
    return { ...DEFAULT_SHAPE, preset: 'hourly', minute: m };
  }

  const h = num(hour);
  if (m !== null && h !== null && everyDom && everyDow) {
    return { ...DEFAULT_SHAPE, preset: 'daily', minute: m, hour: h, months, daysOfWeek: [] };
  }

  const daysOfWeek = parseDaysOfWeekField(dayOfWeek);
  if (m !== null && h !== null && everyDom && daysOfWeek !== null) {
    // All seven weekdays is the same schedule as every day — collapse so the
    // Daily “Every day” control round-trips instead of leaving every toggle on.
    if (daysOfWeek.length === 7) {
      return { ...DEFAULT_SHAPE, preset: 'daily', minute: m, hour: h, months, daysOfWeek: [] };
    }
    return { ...DEFAULT_SHAPE, preset: 'weekly', minute: m, hour: h, daysOfWeek, months };
  }

  const dom = parseDayOfMonthToken(dayOfMonth);
  if (m !== null && h !== null && dom !== null && everyDow) {
    return { ...DEFAULT_SHAPE, preset: 'monthly', minute: m, hour: h, dayOfMonth: dom, months };
  }

  return { ...DEFAULT_SHAPE, preset: 'custom' };
}

export function buildCron(shape: CronShape): string {
  const monthField = formatSimpleList(normalizeMonths(shape.months));

  switch (shape.preset) {
    case 'minutely':
      return '* * * * *';
    case 'hourly':
      return `${shape.minute} * * * *`;
    case 'daily':
      return `${shape.minute} ${shape.hour} * ${monthField} *`;
    case 'weekly': {
      const days = normalizeDaysOfWeek(shape.daysOfWeek);
      const dowField = formatSimpleList(days.length === 0 ? [1] : days);
      return `${shape.minute} ${shape.hour} * ${monthField} ${dowField}`;
    }
    case 'monthly':
      return `${shape.minute} ${shape.hour} ${shape.dayOfMonth} ${monthField} *`;
    default:
      return '';
  }
}

/**
 * Human-readable schedule prose via cronstrue. Empty when the expression fails
 * our validator — we do not ask cronstrue to describe something we would refuse
 * to run.
 */
export function describeCron(expr: string | null | undefined): string {
  if (typeof expr !== 'string' || cronError(expr) !== null) return '';

  try {
    const text = cronstrue.toString(expr, {
      throwExceptionOnParseError: true,
      verbose: true,
      use24HourTimeFormat: true,
      // Match standard cron / Cronos: 0 = Sunday.
      dayOfWeekStartIndexZero: true,
    });
    return /[.!?]$/.test(text) ? text : `${text}.`;
  } catch {
    return '';
  }
}

/**
 * Next `count` fire times for a valid expression (Croner / OCPS, seconds
 * optional). Empty when the expression fails our validator or Croner cannot
 * enumerate runs.
 */
export function nextOccurrences(expr: string | null | undefined, count = 5, from: Date = new Date()): Date[] {
  if (typeof expr !== 'string' || cronError(expr) !== null) return [];
  if (!Number.isFinite(count) || count <= 0) return [];

  try {
    return new Cron(expr).nextRuns(count, from);
  } catch {
    return [];
  }
}

/**
 * Joins field values into an expression. Empty core slots become `*`.
 * An empty `second` is omitted so the result stays five-field.
 */
export function joinCron(parts: CronParts): string {
  const core = [parts.minute, parts.hour, parts.dayOfMonth, parts.month, parts.dayOfWeek]
    .map((part) => (part.trim() === '' ? '*' : part.trim()))
    .join(' ');
  const second = parts.second.trim();
  return second === '' ? core : `${second} ${core}`;
}

export type CronFieldKey = keyof CronParts;

export interface CronFieldOption {
  /** Exact field token written into the expression. */
  value: string;
  /** Short human label shown beside the token in the dropdown. */
  label: string;
}

export interface CronFieldDef {
  key: CronFieldKey;
  /** Accessible name for the segment. */
  name: string;
  /** Narrow placeholder hint inside the box. */
  placeholder: string;
  /** Optional field — blank means omitted from the expression. */
  optional?: boolean;
  options: readonly CronFieldOption[];
}

/**
 * Suggestion catalogs for the CronEditor field segments. Free-typing is always
 * allowed — these are the values worth picking rather than remembering.
 * Seconds is first (Cronos order) and optional: leave it blank for five fields.
 */
export const CRON_FIELDS: readonly CronFieldDef[] = [
  {
    key: 'second',
    name: 'Second',
    placeholder: 'sec',
    optional: true,
    options: [
      { value: '', label: 'Omit (five-field cron)' },
      { value: '0', label: 'On the second' },
      { value: '*', label: 'Every second' },
      { value: '*/5', label: 'Every 5 seconds' },
      { value: '*/10', label: 'Every 10 seconds' },
      { value: '*/15', label: 'Every 15 seconds' },
      { value: '*/30', label: 'Every 30 seconds' },
      { value: '0,30', label: 'At :00 and :30' },
    ],
  },
  {
    key: 'minute',
    name: 'Minute',
    placeholder: '0-59',
    options: [
      { value: '*', label: 'Every minute' },
      { value: '0', label: 'On the hour' },
      { value: '*/5', label: 'Every 5 minutes' },
      { value: '*/10', label: 'Every 10 minutes' },
      { value: '*/15', label: 'Every 15 minutes' },
      { value: '*/30', label: 'Every 30 minutes' },
      { value: '0,30', label: 'At :00 and :30' },
      { value: '0-59', label: 'Minutes 0–59' },
    ],
  },
  {
    key: 'hour',
    name: 'Hour',
    placeholder: '0-23',
    options: [
      { value: '*', label: 'Every hour' },
      { value: '0', label: 'Midnight' },
      { value: '9', label: '09:00' },
      { value: '12', label: 'Noon' },
      { value: '17', label: '17:00' },
      { value: '9-17', label: '09:00–17:00' },
      { value: '0-8', label: '00:00–08:00' },
      { value: '18-23', label: '18:00–23:00' },
      { value: '*/2', label: 'Every 2 hours' },
      { value: '0-23/2', label: 'Even hours' },
      { value: '1-23/2', label: 'Odd hours' },
    ],
  },
  {
    key: 'dayOfMonth',
    name: 'Day of month',
    placeholder: '1-31',
    options: [
      { value: '*', label: 'Every day of month' },
      { value: '1', label: '1st' },
      { value: '15', label: '15th' },
      { value: '1-15', label: '1st–15th' },
      { value: '16-31', label: '16th–31st' },
      { value: '1,15', label: '1st and 15th' },
      ...DAY_OF_MONTH_SPECIALS.map((special) => ({ value: special.value, label: special.label })),
    ],
  },
  {
    key: 'month',
    name: 'Month',
    placeholder: '1-12',
    options: [
      { value: '*', label: 'Every month' },
      { value: '1', label: 'January' },
      { value: '6', label: 'June' },
      { value: '12', label: 'December' },
      { value: '1-3', label: 'Jan–Mar' },
      { value: '4-6', label: 'Apr–Jun' },
      { value: '7-9', label: 'Jul–Sep' },
      { value: '10-12', label: 'Oct–Dec' },
      { value: '6-8', label: 'Jun–Aug' },
      { value: '1,7', label: 'January and July' },
      { value: '1-12', label: 'Months 1–12' },
    ],
  },
  {
    key: 'dayOfWeek',
    name: 'Day of week',
    placeholder: '0-7',
    options: [
      { value: '*', label: 'Every day of week' },
      { value: '1-5', label: 'Weekdays (Mon–Fri)' },
      { value: '0,6', label: 'Weekend (Sun, Sat)' },
      { value: '0', label: 'Sunday' },
      { value: '1', label: 'Monday' },
      { value: '2', label: 'Tuesday' },
      { value: '3', label: 'Wednesday' },
      { value: '4', label: 'Thursday' },
      { value: '5', label: 'Friday' },
      { value: '6', label: 'Saturday' },
      { value: '1-3', label: 'Mon–Wed' },
      { value: '1,3,5', label: 'Mon, Wed, Fri' },
    ],
  },
];
