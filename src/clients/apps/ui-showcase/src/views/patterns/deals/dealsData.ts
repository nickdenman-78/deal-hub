/*
 * Placeholder data and a showcase-only ASX product code decoder for the deal capture pattern.
 *
 * The decode rules mirror `modelling/ddd/deals/deals.cml` (CommodityCode, ContractMonth, ProductCode). Contract
 * sizes are NOT ASX's published schedule: base load is days x 24 h, and the peak profiles use a weekday or
 * hours-per-day approximation, which is enough to make the screens realistic. The real screen gets both the
 * decode and the size from the API's product lookup.
 */
import { reactive } from 'vue';

export type Direction = 'Buy' | 'Sell';
export type Region = 'NSW' | 'VIC' | 'QLD' | 'SA';
export type Period = 'Month' | 'Quarter' | 'Strip';
export type Payoff = 'Standard' | '$300 cap';

export interface LoadProfile {
  name: string;
  window: string;
  weekdaysOnly: boolean;
  hoursPerDay: number;
}

export interface Product {
  code: string;
  region: Region;
  regionDescription: string;
  profile: LoadProfile;
  payoff: Payoff;
  period: Period;
  expiry: string;
  term: string;
  termStart: Date;
  termEnd: Date;
  /** Undefined when ASX does not list the product, so there is no contract size. */
  contractSize?: { days: number; mwhPerLot: number };
}

export interface Deal {
  id: string;
  capturedAt: Date;
  direction: Direction;
  product: Product;
  /** $/MWh. */
  price: number;
  /** Lots, in MW. */
  volume: number;
}

export type DecodeResult = { ok: true; product: Product } | { ok: false; message: string };

const BASE: LoadProfile = { name: 'Base load', window: '00:00–24:00 Mon–Sun', weekdaysOnly: false, hoursPerDay: 24 };
const PEAK: LoadProfile = {
  name: 'Peak load',
  window: '07:00–22:00 Mon–Fri, excluding public holidays',
  weekdaysOnly: true,
  hoursPerDay: 15,
};
const MORNING: LoadProfile = {
  name: 'Morning peak',
  window: '06:00–09:00 Mon–Sun',
  weekdaysOnly: false,
  hoursPerDay: 3,
};
const EVENING: LoadProfile = {
  name: 'Evening peak',
  window: '16:00–21:00 Mon–Sun',
  weekdaysOnly: false,
  hoursPerDay: 5,
};

const FAMILIES: Record<string, { profile: LoadProfile; payoff: Payoff; period: Period }> = {
  E: { profile: BASE, payoff: 'Standard', period: 'Month' },
  B: { profile: BASE, payoff: 'Standard', period: 'Quarter' },
  H: { profile: BASE, payoff: 'Standard', period: 'Strip' },
  P: { profile: PEAK, payoff: 'Standard', period: 'Quarter' },
  D: { profile: PEAK, payoff: 'Standard', period: 'Strip' },
  M: { profile: MORNING, payoff: 'Standard', period: 'Quarter' },
  J: { profile: MORNING, payoff: 'Standard', period: 'Strip' },
  N: { profile: EVENING, payoff: 'Standard', period: 'Quarter' },
  L: { profile: EVENING, payoff: 'Standard', period: 'Strip' },
  G: { profile: BASE, payoff: '$300 cap', period: 'Quarter' },
  R: { profile: BASE, payoff: '$300 cap', period: 'Strip' },
};

const REGIONS: Record<string, { region: Region; description: string }> = {
  N: { region: 'NSW', description: 'New South Wales and ACT' },
  V: { region: 'VIC', description: 'Victoria' },
  Q: { region: 'QLD', description: 'Queensland' },
  S: { region: 'SA', description: 'South Australia' },
};

const MONTH_LETTERS = 'FGHJKMNQUVXZ';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Placeholder listing rule: ASX lists expiries from 2026 to 2030. */
const LISTED_YEARS = { first: 2026, last: 2030 };

/** A short legend for the empty decode panel. */
export const CODE_LEGEND =
  'Family + region + expiry month + year, e.g. BNH27. B base quarter, H base strip, E base month, P/D peak, G/R $300 cap; N NSW, V VIC, Q QLD, S SA.';

const DAY_MS = 86_400_000;

function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function countDays(start: Date, end: Date, weekdaysOnly: boolean): number {
  let days = 0;
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const weekday = new Date(t).getUTCDay();
    if (!weekdaysOnly || (weekday !== 0 && weekday !== 6)) days += 1;
  }
  return days;
}

export function decodeProductCode(raw: string): DecodeResult {
  const code = raw.trim().toUpperCase();
  const match = /^([A-Z])([A-Z])([A-Z])(\d{2})$/.exec(code);
  if (!match) return { ok: false, message: 'Not an ASX electricity futures code. Expected a code like BNH27.' };

  const [, familyLetter = '', regionLetter = '', monthLetter = '', yy = ''] = match;
  const family = FAMILIES[familyLetter];
  if (!family) return { ok: false, message: `${familyLetter} is not an ASX electricity futures product family.` };
  const region = REGIONS[regionLetter];
  if (!region) return { ok: false, message: `${regionLetter} is not a NEM region ASX lists (N, V, Q or S).` };
  const monthIndex = MONTH_LETTERS.indexOf(monthLetter);
  if (monthIndex < 0) return { ok: false, message: `${monthLetter} is not a futures month letter.` };

  const year = 2000 + Number(yy);
  let term: string;
  let termStart: Date;
  let termEnd: Date;

  if (family.period === 'Month') {
    term = `${MONTH_NAMES[monthIndex]}${yy}`;
    termStart = utc(year, monthIndex, 1);
    termEnd = utc(year, monthIndex + 1, 0);
  } else if (family.period === 'Quarter') {
    if (monthIndex % 3 !== 2) return { ok: false, message: 'A quarter contract expires in H, M, U or Z.' };
    const quarter = (monthIndex + 1) / 3;
    term = `Q${quarter} ${year}`;
    termStart = utc(year, monthIndex - 2, 1);
    termEnd = utc(year, monthIndex + 1, 0);
  } else if (monthLetter === 'Z') {
    term = `Cal${String(year + 1).slice(2)}`;
    termStart = utc(year + 1, 0, 1);
    termEnd = utc(year + 1, 11, 31);
  } else if (monthLetter === 'M') {
    term = `Fin${String(year + 1).slice(2)}/${String(year + 2).slice(2)}`;
    termStart = utc(year, 6, 1);
    termEnd = utc(year + 1, 5, 30);
  } else {
    return { ok: false, message: 'A strip expires in M (financial year) or Z (calendar year).' };
  }

  const listed = year >= LISTED_YEARS.first && year <= LISTED_YEARS.last;
  const days = countDays(termStart, termEnd, family.profile.weekdaysOnly);

  return {
    ok: true,
    product: {
      code,
      region: region.region,
      regionDescription: region.description,
      profile: family.profile,
      payoff: family.payoff,
      period: family.period,
      expiry: `${MONTH_NAMES[monthIndex]} ${year}`,
      term,
      termStart,
      termEnd,
      contractSize: listed ? { days, mwhPerLot: days * family.profile.hoursPerDay } : undefined,
    },
  };
}

/** A product's one-line name, e.g. "NSW base load Q1 2027". */
export function productName(product: Product): string {
  const payoff = product.payoff === '$300 cap' ? ' $300 cap' : '';
  return `${product.region} ${product.profile.name.toLowerCase()}${payoff} ${product.term}`;
}

export function contractedEnergy(deal: Deal): number {
  return deal.volume * (deal.product.contractSize?.mwhPerLot ?? 0);
}

const numberFormats = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, fractionDigits = 0): string {
  let format = numberFormats.get(fractionDigits);
  if (!format) {
    format = new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    numberFormats.set(fractionDigits, format);
  }
  return format.format(value);
}

// NEM time is AEST all year (no daylight saving), which Brisbane observes.
const dateTimeFormat = new Intl.DateTimeFormat('en-AU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Australia/Brisbane',
});
const dateFormat = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatCaptured(value: Date): string {
  return dateTimeFormat.format(value).replace(',', '');
}

export function formatDate(value: Date): string {
  return dateFormat.format(value);
}

/** The captured day as YYYY-MM-DD in AEST, for the date range filter. */
export function capturedDay(value: Date): string {
  return new Date(value.getTime() + 10 * 3_600_000).toISOString().slice(0, 10);
}

function seed(id: string, at: string, direction: Direction, code: string, volume: number, price: number): Deal {
  const decoded = decodeProductCode(code);
  if (!decoded.ok) throw new Error(`Seed product ${code} does not decode: ${decoded.message}`);
  return { id, capturedAt: new Date(at), direction, product: decoded.product, price, volume };
}

export const deals = reactive<Deal[]>([
  seed('d-0010', '2026-10-31T00:42:00Z', 'Buy', 'BNH27', 5, 112.5),
  seed('d-0009', '2026-10-31T00:15:00Z', 'Sell', 'BVM27', 10, 98.75),
  seed('d-0008', '2026-10-30T23:58:00Z', 'Buy', 'GSH27', 2, 14.2),
  seed('d-0007', '2026-10-30T06:31:00Z', 'Buy', 'HNZ27', 3, 104),
  seed('d-0006', '2026-10-30T04:07:00Z', 'Sell', 'PNH27', 4, 141.3),
  seed('d-0005', '2026-10-30T01:22:00Z', 'Buy', 'ENF27', 8, 126.85),
  seed('d-0004', '2026-10-29T05:48:00Z', 'Sell', 'BQU27', 6, 89.4),
  seed('d-0003', '2026-10-28T23:05:00Z', 'Buy', 'RVZ26', 1, 9.85),
  seed('d-0002', '2026-10-28T03:36:00Z', 'Buy', 'DQM27', 2, 118.6),
  seed('d-0001', '2026-10-28T00:11:00Z', 'Sell', 'BSM27', 5, 121.15),
]);

export function findDeal(id: string): Deal | undefined {
  return deals.find((deal) => deal.id === id);
}

let nextId = deals.length + 1;

/** Stands in for `POST /api/deals/asx-futures`: resolves with the new deal after a short delay. */
export function captureDeal(input: Omit<Deal, 'id' | 'capturedAt'>): Promise<Deal> {
  const deal: Deal = { ...input, id: `d-${String(nextId++).padStart(4, '0')}`, capturedAt: new Date() };
  return new Promise((resolve) => {
    setTimeout(() => {
      deals.unshift(deal);
      resolve(deal);
    }, 600);
  });
}

/** Where the pattern is mounted in the showcase; the real app routes it at `/deals`. */
export const DEALS_BASE = '/patterns/deal-capture';

/** True when a key press is typing into a field, so single-key shortcuts must leave it alone. */
export function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
