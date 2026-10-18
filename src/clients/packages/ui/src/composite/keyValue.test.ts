import { describe, expect, it } from 'vitest';
import {
  duplicateKeyIndexes,
  emptyRow,
  keyError,
  newRowId,
  rowsError,
  sortRows,
  toRecord,
  toRows,
  type KeyValueRow,
} from './keyValue';

const rows = (...pairs: [string, string][]): KeyValueRow[] =>
  pairs.map(([key, value]) => ({ id: newRowId(), key, value }));

describe('toRows / toRecord', () => {
  it('round-trips a record through rows', () => {
    const record = { timeout: '30s', retries: '3' };
    expect(toRecord(toRows(record))).toEqual(record);
  });

  it('treats null and undefined as an empty map', () => {
    expect(toRows(null)).toEqual([]);
    expect(toRows(undefined)).toEqual([]);
  });

  it('gives every row a distinct id, so Vue does not reuse inputs across rows', () => {
    const ids = toRows({ a: '1', b: '2', c: '3' }).map((row) => row.id);
    expect(new Set(ids).size).toBe(3);
    expect(emptyRow().id).not.toBe(emptyRow().id);
  });

  /*
   * The half-typed states a Record cannot hold. These are not errors in the
   * rows — they are why the rows exist — and toRecord has to produce something
   * bindable regardless, with rowsError carrying the complaint.
   */
  it('skips a row with no key yet', () => {
    expect(toRecord(rows(['', 'orphan'], ['a', '1']))).toEqual({ a: '1' });
  });

  it('keeps the last value when a key repeats, matching Object.fromEntries', () => {
    expect(toRecord(rows(['a', 'first'], ['a', 'second']))).toEqual({ a: 'second' });
  });

  it('trims keys but leaves values exactly as typed', () => {
    expect(toRecord(rows([' spaced ', '  value  ']))).toEqual({ spaced: '  value  ' });
  });
});

describe('duplicateKeyIndexes', () => {
  it('reports the later occurrence, not the first', () => {
    expect(duplicateKeyIndexes(rows(['a', '1'], ['b', '2'], ['a', '3']))).toEqual([2]);
  });

  it('ignores keyless rows, which are not duplicates of each other', () => {
    expect(duplicateKeyIndexes(rows(['', '1'], ['', '2']))).toEqual([]);
  });

  it('folds case only when told to', () => {
    expect(duplicateKeyIndexes(rows(['A', '1'], ['a', '2']))).toEqual([]);
    expect(duplicateKeyIndexes(rows(['A', '1'], ['a', '2']), { caseInsensitive: true })).toEqual([1]);
  });
});

describe('keyError', () => {
  it('leaves a blank new row alone', () => {
    expect(keyError('')).toBeUndefined();
  });

  it('applies a pattern with the caller’s wording', () => {
    const rules = { pattern: /^[A-Z_]+$/, patternMessage: 'Upper case and underscores only.' };
    expect(keyError('Timeout', rules)).toBe('Upper case and underscores only.');
    expect(keyError('TIMEOUT', rules)).toBeUndefined();
  });

  it('enforces a length limit', () => {
    expect(keyError('abcdef', { maxKeyLength: 3 })).toBe('Keys are limited to 3 characters.');
  });
});

describe('rowsError', () => {
  it('is silent on a well-formed map', () => {
    expect(rowsError(rows(['a', '1'], ['b', '2']))).toBeUndefined();
  });

  it('is silent on a blank row, which is how a new one starts', () => {
    expect(rowsError(rows(['', '']))).toBeUndefined();
  });

  /*
   * The one that matters most. A duplicate key silently drops a value the
   * operator typed, and the row it dropped is still on screen looking saved.
   */
  it('names the repeated key', () => {
    expect(rowsError(rows(['a', '1'], ['a', '2']))).toBe('“a” is listed more than once.');
  });

  it('names a value with no key, which would otherwise vanish on save', () => {
    expect(rowsError(rows(['', 'orphan']))).toBe('Every value needs a key.');
  });

  it('reports a malformed key ahead of a duplicate', () => {
    const rules = { pattern: /^[a-z]+$/, patternMessage: 'Lower case only.' };
    expect(rowsError(rows(['A', '1'], ['b', '2'], ['b', '3']), rules)).toBe('Lower case only.');
  });
});

describe('sortRows', () => {
  it('sorts by key without regard to case, and does not mutate', () => {
    const original = rows(['b', '2'], ['A', '1'], ['c', '3']);
    expect(sortRows(original).map((row) => row.key)).toEqual(['A', 'b', 'c']);
    expect(original.map((row) => row.key)).toEqual(['b', 'A', 'c']);
  });
});
