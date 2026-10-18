import { describe, expect, it } from 'vitest';
import {
  ID_NAME_DESCRIPTION,
  ID_NAME_MAX,
  formatCurrency,
  formatDigitGroups,
  idNameProblem,
  idNameRule,
  maskAuIntlPhone,
  maskAuLandline,
  maskAuMobile,
  maskCurrency,
  normalizeIdName,
  rawCurrency,
  unformatAuIntlPhone,
  unformatAuLandline,
  unformatAuMobile,
  unformatCurrency,
} from './mask';

describe('normalizeIdName', () => {
  it('lowercases, turns spaces into hyphens, and drops off-charset chars', () => {
    expect(normalizeIdName('Foo Bar!!')).toBe('foo-bar');
    // Trailing whitespace becomes a trailing hyphen (kept while typing).
    expect(normalizeIdName('  Pricing API  ')).toBe('pricing-api-');
    expect(normalizeIdName('  Pricing API  ', { trimTrailingDash: true })).toBe('pricing-api');
  });

  it('keeps a trailing hyphen while typing so space mid-word still works', () => {
    expect(normalizeIdName('a ')).toBe('a-');
    expect(normalizeIdName('a-', { trimTrailingDash: true })).toBe('a');
  });

  it('collapses repeated hyphens and strips a non-letter prefix', () => {
    expect(normalizeIdName('99--foo--bar')).toBe('foo-bar');
  });

  it('caps length', () => {
    expect(normalizeIdName('a'.repeat(80)).length).toBe(ID_NAME_MAX);
  });

  it('preserves case when allowUppercase is set', () => {
    expect(normalizeIdName('Foo Bar', { allowUppercase: true })).toBe('Foo-Bar');
  });
});

describe('idNameProblem', () => {
  it("treats empty as the caller's required-field problem", () => {
    expect(idNameProblem('')).toBeNull();
    expect(idNameProblem('   ')).toBeNull();
  });

  it('rejects a trailing hyphen and leading digit shapes', () => {
    expect(idNameProblem('foo-')).toBe(`Name ${ID_NAME_DESCRIPTION}.`);
    expect(idNameProblem('1foo')).toBe(`Name ${ID_NAME_DESCRIPTION}.`);
  });

  it('accepts a valid lowercase id', () => {
    expect(idNameProblem('rdcs-pricing')).toBeNull();
  });

  it('rejects reserved names', () => {
    expect(idNameProblem('_base', { reserved: new Set(['_base', '_vars']) })).toBe("'_base' is reserved.");
  });
});

describe('idNameRule', () => {
  it('returns true or a message for Input rules', () => {
    const rule = idNameRule();
    expect(rule('')).toBe(true);
    expect(rule('rdcs-pricing')).toBe(true);
    expect(rule('Foo')).toBe(`Name ${ID_NAME_DESCRIPTION}.`);
  });
});

describe('maskCurrency', () => {
  it('keeps a typeable draft without grouping separators', () => {
    expect(maskCurrency('1,234.5a6')).toBe('1234.56');
    expect(maskCurrency('12.3456')).toBe('12.34');
    expect(maskCurrency('-')).toBe('-');
    expect(maskCurrency('12.')).toBe('12.');
  });

  it('can refuse a leading minus', () => {
    expect(maskCurrency('-12', { allowNegative: false })).toBe('12');
  });
});

describe('formatCurrency / unformatCurrency', () => {
  it('formats with thousands separators and fixed decimals on blur', () => {
    expect(formatCurrency('1234.5', { locale: 'en-AU' })).toBe('1,234.50');
    expect(formatCurrency('1000000', { locale: 'en-AU' })).toBe('1,000,000.00');
  });

  it('exposes a raw wire value without grouping', () => {
    expect(rawCurrency('1,234.5')).toBe('1234.50');
    expect(rawCurrency('1000', { fractionDigits: 0 })).toBe('1000');
    expect(rawCurrency('')).toBe('');
  });

  it('leaves empty and incomplete drafts alone', () => {
    expect(formatCurrency('')).toBe('');
    expect(formatCurrency('-')).toBe('-');
  });

  it('strips grouping so the field is editable again on focus', () => {
    expect(unformatCurrency('1,234.50')).toBe('1234.50');
    expect(unformatCurrency('1,000,000.00')).toBe('1000000.00');
  });
});

describe('formatDigitGroups', () => {
  it('groups digits in threes from the end', () => {
    expect(formatDigitGroups('0412345678')).toBe('0 412 345 678');
    expect(formatDigitGroups('412345678')).toBe('412 345 678');
    expect(formatDigitGroups('4123')).toBe('4 123');
  });
});

describe('AU telephone masks (Style Manual)', () => {
  it('formats domestic mobiles as 04XX XXX XXX', () => {
    expect(maskAuMobile('0412345678')).toBe('0412 345 678');
    expect(maskAuMobile('0412 345 6789 extra')).toBe('0412 345 678');
    expect(maskAuMobile('04ab12')).toBe('0412');
    expect(maskAuMobile('0491570159')).toBe('0491 570 159');
    expect(unformatAuMobile('0412 345 678')).toBe('0412345678');
  });

  it('formats domestic landlines as 0A XXXX XXXX', () => {
    expect(maskAuLandline('0255504321')).toBe('02 5550 4321');
    expect(maskAuLandline('02 5550 4321')).toBe('02 5550 4321');
    expect(maskAuLandline('03')).toBe('03');
    expect(maskAuLandline('039876')).toBe('03 9876');
    expect(unformatAuLandline('02 5550 4321')).toBe('0255504321');
  });

  it('formats international mobiles as +61 4XX XXX XXX', () => {
    expect(maskAuIntlPhone('+61491570159')).toBe('+61 491 570 159');
    expect(maskAuIntlPhone('61491570159')).toBe('+61 491 570 159');
    expect(maskAuIntlPhone('+61 491')).toBe('+61 491');
    expect(unformatAuIntlPhone('+61 491 570 159')).toBe('+61491570159');
    expect(unformatAuIntlPhone('+')).toBe('+');
  });

  it('formats international landlines as +61 A XXXX XXXX', () => {
    expect(maskAuIntlPhone('+61255504321')).toBe('+61 2 5550 4321');
    expect(maskAuIntlPhone('+61 2 5550 4321')).toBe('+61 2 5550 4321');
  });
});
