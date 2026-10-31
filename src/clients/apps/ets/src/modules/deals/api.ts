/*
 * The Deals module's API: the shapes Ets.Modules.Deals.Presentation returns and the calls that fetch them.
 */
import { ref } from 'vue';
import { ApiError, apiGet, apiPost } from '@/api/client';

export type Direction = 'Buy' | 'Sell';

/** An ASX product code decoded, with its contract size when ASX lists it (`AsxProductResponse`). */
export interface AsxProduct {
  productCode: string;
  region: string;
  regionDescription: string;
  loadProfile: string;
  loadProfileDescription: string;
  payoff: string;
  payoffDescription: string;
  strike: number | null;
  period: string;
  expiryMonth: number;
  expiryYear: number;
  term: string;
  /** ISO date, `YYYY-MM-DD`. */
  termStart: string;
  /** ISO date, `YYYY-MM-DD`. */
  termEnd: string;
  listed: boolean;
  contractDays: number | null;
  /** MWh per lot. */
  contractSize: number | null;
}

/** An ASX futures deal (`AsxFuturesDealResponse`). */
export interface AsxFuturesDeal {
  id: string;
  direction: Direction;
  /** $/MWh. */
  price: number;
  /** Lots, in MW. */
  volume: number;
  /** MWh. */
  contractedEnergy: number;
  /** ISO instant. */
  capturedAt: string;
  product: AsxProduct;
}

export interface CaptureAsxFuturesDealRequest {
  productCode: string;
  direction: Direction;
  price: number;
  volume: number;
}

/** An RFC 7807 problem as the API returns it; `title` carries the domain error code. */
export interface Problem {
  title?: string;
  detail?: string;
  status?: number;
  /** A validation problem's individual errors, each with its own domain error code. */
  errors?: { code?: string; description?: string }[];
}

export const listDeals = () => apiGet<AsxFuturesDeal[]>('/api/deals');

export const getDeal = (id: string) => apiGet<AsxFuturesDeal>(`/api/deals/${encodeURIComponent(id)}`);

export const lookUpProduct = (code: string) =>
  apiGet<AsxProduct>(`/api/deals/asx-products/${encodeURIComponent(code)}`);

export const captureDeal = (request: CaptureAsxFuturesDealRequest) =>
  apiPost<{ id: string }>('/api/deals/asx-futures', request);

/** The problem body of a failed call, when the API sent one. */
export function problemOf(error: unknown): Problem | undefined {
  return error instanceof ApiError && typeof error.body === 'object' && error.body !== null
    ? (error.body as Problem)
    : undefined;
}

/**
 * Bumped after a deal is captured, so the list reloads without the capture blade reaching into it.
 */
export const dealsChanged = ref(0);
