import { describe, it, expect } from 'vitest';
import { useTableFilters, distinctFilterOptions } from './useTableFilters';

interface Filters extends Record<string, unknown> {
  includeExpired: boolean;
  consortiumIds: number[];
  accountManager: string;
  startRange: { from?: string; to?: string };
}

const DEFAULTS: Filters = {
  includeExpired: false,
  consortiumIds: [],
  accountManager: '',
  startRange: {},
};

describe('useTableFilters', () => {
  it('starts unfiltered', () => {
    const f = useTableFilters(DEFAULTS);
    expect(f.active.value).toBe(false);
    expect(f.activeCount.value).toBe(0);
  });

  it('counts a text filter once it has text', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.accountManager = 'Raman';
    expect(f.activeCount.value).toBe(1);
    expect(f.activeKeys.value).toEqual(['accountManager']);
  });

  it('does not count whitespace-free emptiness as a change', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.accountManager = 'Raman';
    f.values.accountManager = '';
    expect(f.active.value).toBe(false);
  });

  it('counts a list filter by contents, not identity', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.consortiumIds = [];
    // A fresh empty array is a different object but the same value.
    expect(f.active.value).toBe(false);
    f.values.consortiumIds = [7];
    expect(f.activeCount.value).toBe(1);
  });

  /*
   * The case truthiness gets wrong: `false` is this filter's default, so `true`
   * is filtering. A count written as `if (value)` would agree here by accident
   * and disagree for a filter whose default is non-empty.
   */
  it('counts a boolean that differs from its default, in either direction', () => {
    const on = useTableFilters(DEFAULTS);
    on.values.includeExpired = true;
    expect(on.activeCount.value).toBe(1);

    const off = useTableFilters({ ...DEFAULTS, includeExpired: true });
    expect(off.active.value).toBe(false);
    off.values.includeExpired = false;
    expect(off.activeCount.value).toBe(1);
  });

  it('treats an empty range and a cleared range as the same value', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.startRange = { from: undefined, to: undefined };
    expect(f.active.value).toBe(false);
    f.values.startRange = { from: '2026-07-01' };
    expect(f.activeCount.value).toBe(1);
  });

  it('counts each changed filter separately', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.includeExpired = true;
    f.values.consortiumIds = [1, 2];
    f.values.startRange = { from: '2026-07-01' };
    expect(f.activeCount.value).toBe(3);
  });

  it('clears every filter, including the ones added last', () => {
    const f = useTableFilters(DEFAULTS);
    f.values.includeExpired = true;
    f.values.consortiumIds = [1];
    f.values.accountManager = 'Raman';
    f.values.startRange = { from: '2026-07-01', to: '2026-07-31' };

    f.clear();

    expect(f.active.value).toBe(false);
    expect(f.values).toEqual(DEFAULTS);
  });

  it('does not mutate the caller’s defaults', () => {
    const defaults: Filters = structuredClone(DEFAULTS);
    const f = useTableFilters(defaults);
    f.values.consortiumIds.push(9);
    f.values.includeExpired = true;
    expect(defaults.consortiumIds).toEqual([]);
    expect(defaults.includeExpired).toBe(false);
  });

  it('restores the defaults it was given, not the current values', () => {
    const f = useTableFilters({ ...DEFAULTS, accountManager: 'Raman' });
    f.values.accountManager = 'Whitlock';
    f.clear();
    expect(f.values.accountManager).toBe('Raman');
  });
});

describe('distinctFilterOptions', () => {
  it('de-duplicates and sorts', () => {
    expect(distinctFilterOptions(['Depot', 'Mill', 'Depot'])).toEqual(['Depot', 'Mill']);
  });

  it('drops null, undefined and empty', () => {
    expect(distinctFilterOptions(['Mill', null, undefined, ''])).toEqual(['Mill']);
  });

  it('keeps a current value no row carries any more', () => {
    // Otherwise the control reads as unset while the table sits empty.
    expect(distinctFilterOptions(['Mill'], 'Kiln')).toEqual(['Kiln', 'Mill']);
  });

  it('keeps every current value of a multi-select', () => {
    expect(distinctFilterOptions(['Mill'], ['Kiln', 'Depot'])).toEqual(['Depot', 'Kiln', 'Mill']);
  });

  it('does not duplicate a current value the rows already carry', () => {
    expect(distinctFilterOptions(['Mill'], 'Mill')).toEqual(['Mill']);
  });
});
