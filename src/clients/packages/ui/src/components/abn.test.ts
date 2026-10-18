import { describe, expect, it } from 'vitest';
import { abnProblem, isValidAbn, maskAbn, unformatAbn } from './abn';

describe('maskAbn', () => {
  it('formats as XX XXX XXX XXX', () => {
    expect(maskAbn('51824753556')).toBe('51 824 753 556');
    expect(maskAbn('51')).toBe('51');
    expect(maskAbn('51824')).toBe('51 824');
  });
});

describe('isValidAbn / abnProblem', () => {
  it('accepts the ABR documentation example', () => {
    expect(isValidAbn('51824753556')).toBe(true);
    expect(abnProblem('51 824 753 556')).toBeNull();
  });

  it('rejects wrong length and bad checksums', () => {
    expect(abnProblem('51824753557')).toBe('ABN failed the checksum check.');
    expect(abnProblem('5182475355')).toBe('ABN must be 11 digits.');
    expect(abnProblem('')).toBeNull();
    expect(unformatAbn('51 824 753 556')).toBe('51824753556');
  });
});
