import { describe, expect, it } from 'vitest';
import type { AsxProduct } from './api';
import { errorsOfProblem, fieldOfProblem, validateQuote, type ProductState, type Quote } from './quote';

const product = (overrides: Partial<AsxProduct> = {}): AsxProduct => ({
  productCode: 'BNH27',
  region: 'NSW',
  regionDescription: 'New South Wales',
  loadProfile: 'Base',
  loadProfileDescription: 'All hours',
  payoff: 'Standard',
  payoffDescription: 'Settles against the average spot price',
  strike: null,
  period: 'Quarter',
  expiryMonth: 3,
  expiryYear: 2027,
  term: 'Q1 2027',
  termStart: '2027-01-01',
  termEnd: '2027-03-31',
  listed: true,
  contractDays: 90,
  contractSize: 2160,
  ...overrides,
});

const decoded = (overrides: Partial<AsxProduct> = {}): ProductState => ({
  kind: 'decoded',
  product: product(overrides),
});

const quote = (overrides: Partial<Quote> = {}): Quote => ({
  code: 'BNH27',
  direction: 'Buy',
  price: '85.50',
  volume: '5',
  ...overrides,
});

describe('validateQuote', () => {
  it('accepts a complete quote for a listed product', () => {
    expect(validateQuote(quote(), decoded())).toEqual({});
  });

  it('requires every field', () => {
    const errors = validateQuote({ code: '', direction: undefined, price: '', volume: '' }, { kind: 'empty' });
    expect(Object.keys(errors).sort()).toEqual(['code', 'direction', 'price', 'volume']);
  });

  it('reports the lookup message for an invalid code', () => {
    const errors = validateQuote(quote({ code: 'BNF26' }), { kind: 'invalid', message: 'Bad month.' });
    expect(errors.code).toBe('Bad month.');
  });

  it('rejects a product ASX does not list', () => {
    expect(validateQuote(quote({ code: 'bnh33' }), decoded({ listed: false })).code).toBe('ASX does not list BNH33.');
  });

  it('waits while the code is being checked', () => {
    expect(validateQuote(quote(), { kind: 'checking' }).code).toBe('Waiting for the product code to be checked.');
  });

  it('rejects a price off the $0.01 tick', () => {
    expect(validateQuote(quote({ price: '85.555' }), decoded()).price).toBe('Prices move in steps of $0.01/MWh.');
  });

  it('allows a negative price on a standard product but not on a cap', () => {
    expect(validateQuote(quote({ price: '-10' }), decoded()).price).toBeUndefined();
    expect(validateQuote(quote({ price: '-10' }), decoded({ strike: 300 })).price).toBe(
      'A $300 cap price cannot be negative.',
    );
  });

  it.each(['0', '-1', '2.5'])('rejects a volume of %s lots', (volume) => {
    expect(validateQuote(quote({ volume }), decoded()).volume).toBe('A whole number of lots, at least 1.');
  });
});

describe('fieldOfProblem', () => {
  it.each([
    ['deal.product-code.invalid', 'code'],
    ['deal.asx-product.not-listed', 'code'],
    ['deal.asx-futures.direction.required', 'direction'],
    ['deal.asx-futures.price.tick', 'price'],
    ['deal.asx-futures.volume.whole-lots', 'volume'],
    ['deal.something-else', undefined],
    [undefined, undefined],
  ])('maps %s to %s', (code, field) => {
    expect(fieldOfProblem(code)).toBe(field);
  });
});

describe('errorsOfProblem', () => {
  it('places a single problem on its field', () => {
    expect(errorsOfProblem({ title: 'deal.asx-futures.price.tick', detail: 'Off tick.' })).toEqual({
      fields: { price: 'Off tick.' },
    });
  });

  it('places each error of a validation problem', () => {
    const result = errorsOfProblem({
      title: 'General.Validation',
      detail: 'One or more validation errors occurred.',
      errors: [
        { code: 'deal.asx-futures.price.tick', description: 'Off tick.' },
        { code: 'deal.asx-futures.volume.invalid', description: 'No lots.' },
      ],
    });
    expect(result).toEqual({ fields: { price: 'Off tick.', volume: 'No lots.' } });
  });

  it('returns what belongs to no field as a form message', () => {
    expect(errorsOfProblem({ title: 'deal.conflict', detail: 'Already captured.' })).toEqual({
      fields: {},
      other: 'Already captured.',
    });
  });

  it('falls back to a generic message when the problem says nothing', () => {
    expect(errorsOfProblem(undefined)).toEqual({ fields: {}, other: 'The deal could not be captured.' });
  });
});
