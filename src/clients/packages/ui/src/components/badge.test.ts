import { describe, expect, it } from 'vitest';
import { formatBadgeContent } from './badge';

describe('formatBadgeContent', () => {
  it('returns null for empty or zero', () => {
    expect(formatBadgeContent(undefined)).toBeNull();
    expect(formatBadgeContent(null)).toBeNull();
    expect(formatBadgeContent('')).toBeNull();
    expect(formatBadgeContent(0)).toBeNull();
    expect(formatBadgeContent('0')).toBeNull();
  });

  it('passes through counts and caps with max', () => {
    expect(formatBadgeContent(3)).toBe('3');
    expect(formatBadgeContent(99, 99)).toBe('99');
    expect(formatBadgeContent(100, 99)).toBe('99+');
    expect(formatBadgeContent('120', 99)).toBe('99+');
  });

  it('passes non-numeric labels through', () => {
    expect(formatBadgeContent('New')).toBe('New');
    expect(formatBadgeContent('99+')).toBe('99+');
  });
});
