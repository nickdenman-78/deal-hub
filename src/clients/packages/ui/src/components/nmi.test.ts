import { describe, expect, it } from 'vitest';
import { maskNmi, nmiChecksum, nmiProblem, unformatNmi } from './nmi';

describe('maskNmi', () => {
  it('uppercases, strips junk, and spaces the checksum digit', () => {
    expect(maskNmi('nccc0043026')).toBe('NCCC004302 6');
    expect(maskNmi('nccc-004302')).toBe('NCCC004302');
    expect(unformatNmi('NCCC004302 6')).toBe('NCCC0043026');
  });
});

describe('nmiChecksum', () => {
  // Mirrors RetailCoreTests/NMITests and AEMO procedure examples.
  it.each([
    ['7992739871', 5],
    ['1234C6789A', 3],
    ['QCCC000576', 7],
    ['NCCC004302', 6],
    ['2001985732', 8],
    ['NAAAMYS582', 6],
    ['NBBBX11110', 0],
  ] as const)('computes %s → %i', (body, check) => {
    expect(nmiChecksum(body)).toBe(check);
  });
});

describe('nmiProblem', () => {
  it('accepts 10-char bodies and matching 11-char forms', () => {
    expect(nmiProblem('NCCC004302')).toBeNull();
    expect(nmiProblem('NCCC004302 6')).toBeNull();
    expect(nmiProblem('1234C6789A3')).toBeNull();
  });

  it('rejects short, long, and bad checksum values', () => {
    expect(nmiProblem('')).toBeNull();
    expect(nmiProblem('NCCC00430')).toContain('10 characters');
    expect(nmiProblem('NCCC0043027')).toBe('NMI failed the checksum check.');
  });
});
