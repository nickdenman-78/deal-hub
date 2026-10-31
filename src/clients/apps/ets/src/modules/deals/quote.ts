/*
 * The trader's quote on the capture blade, checked before it is sent. These mirror the AsxFuturesDeal invariants so
 * the trader hears about a mistake before the round trip; the API remains the authority and its problem codes are
 * mapped onto the same fields.
 */
import type { AsxProduct, Direction, Problem } from './api';

export interface Quote {
  code: string;
  direction: Direction | undefined;
  price: string;
  volume: string;
}

export type QuoteField = 'code' | 'direction' | 'price' | 'volume';
export type QuoteErrors = Partial<Record<QuoteField, string>>;

/** Validation state of the product code lookup, as far as the quote cares. */
export type ProductState =
  | { kind: 'empty' }
  | { kind: 'checking' }
  | { kind: 'invalid'; message: string }
  | { kind: 'decoded'; product: AsxProduct };

export function validateQuote(quote: Quote, product: ProductState): QuoteErrors {
  const errors: QuoteErrors = {};
  const code = quote.code.trim().toUpperCase();

  if (!code) errors.code = 'A product code is required.';
  else if (product.kind === 'invalid') errors.code = product.message;
  else if (product.kind === 'decoded' && !product.product.listed) errors.code = `ASX does not list ${code}.`;
  else if (product.kind !== 'decoded') errors.code = 'Waiting for the product code to be checked.';

  if (quote.direction !== 'Buy' && quote.direction !== 'Sell') errors.direction = 'Choose Buy or Sell.';

  const price = quote.price === '' ? Number.NaN : Number(quote.price);
  if (Number.isNaN(price)) errors.price = 'A price is required.';
  else if (Math.round(price * 100) !== price * 100) errors.price = 'Prices move in steps of $0.01/MWh.';
  else if (product.kind === 'decoded' && product.product.strike !== null && price < 0) {
    errors.price = 'A $300 cap price cannot be negative.';
  }

  const volume = quote.volume === '' ? Number.NaN : Number(quote.volume);
  if (Number.isNaN(volume) || volume <= 0 || !Number.isInteger(volume)) {
    errors.volume = 'A whole number of lots, at least 1.';
  }

  return errors;
}

/** Which field an API problem code belongs to (`AsxFuturesDeal`, `ProductCode` and catalogue error codes). */
export function fieldOfProblem(code: string | undefined): QuoteField | undefined {
  if (!code) return undefined;
  if (
    ['deal.product-code', 'deal.commodity-code', 'deal.contract-month', 'deal.asx-product'].some((p) =>
      code.startsWith(p),
    )
  ) {
    return 'code';
  }
  if (code.startsWith('deal.asx-futures.direction')) return 'direction';
  if (code.startsWith('deal.asx-futures.price')) return 'price';
  if (code.startsWith('deal.asx-futures.volume')) return 'volume';
  return undefined;
}

/**
 * Spreads an API problem over the quote's fields. Anything that belongs to no field (or a problem with no code at
 * all) comes back as `other`, for the form-level message.
 */
export function errorsOfProblem(problem: Problem | undefined): { fields: QuoteErrors; other?: string } {
  const fields: QuoteErrors = {};
  const unplaced: string[] = [];
  const entries =
    problem?.errors && problem.errors.length > 0
      ? problem.errors
      : [{ code: problem?.title, description: problem?.detail }];

  for (const entry of entries) {
    const field = fieldOfProblem(entry.code);
    const message = entry.description ?? problem?.detail;
    if (field && message) fields[field] ??= message;
    else if (message) unplaced.push(message);
  }

  const other = unplaced.length > 0 ? unplaced.join(' ') : undefined;
  if (Object.keys(fields).length === 0 && !other) return { fields, other: 'The deal could not be captured.' };
  return other ? { fields, other } : { fields };
}

/** True when a key press is typing into a field, so single-key shortcuts must leave it alone. */
export function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
