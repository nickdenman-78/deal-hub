import { describe, expect, it } from 'vitest';
import { hasVariableLengthParams, isPathWithin, prefixPath, segmentCount } from './paths';

describe('isPathWithin', () => {
  it.each([
    ['identical paths are within each other', '/deals/1', '/deals/1', true],
    ['a child is within its parent', '/deals/1', '/deals/1/terms', true],
    ['a sibling is not', '/deals/1', '/deals/2', false],
    // The bug this prevents: startsWith alone would say /deals/12 is inside
    // /deals/1, and a dirty guard would then let you walk away from unsaved
    // changes without a prompt.
    ['a longer sibling segment is not', '/deals/1', '/deals/12', false],
    ['a parent is not within its child', '/deals/1/terms', '/deals/1', false],
    ['everything is within the root', '/', '/deals/1', true],
    ['the root is within itself', '/', '/', true],
    ['a trailing slash does not change the answer', '/deals/1/', '/deals/1', true],
  ])('%s', (_label, base, path, expected) => {
    expect(isPathWithin(base, path)).toBe(expected);
  });
});

describe('segmentCount', () => {
  it.each([
    ['/', 0],
    ['', 0],
    ['/deals', 1],
    ['/deals/:id', 2],
    ['/deals/:id/terms/:termId', 4],
    // Counted, never parsed, so a custom regex containing a slash-free pattern
    // is just another segment.
    ['/invoices/:id(\\d+)', 2],
  ])('%s consumes %i segments', (pattern, expected) => {
    expect(segmentCount(pattern)).toBe(expected);
  });
});

describe('prefixPath', () => {
  it.each([
    ['/deals/abc/terms', 0, '/'],
    ['/deals/abc/terms', 1, '/deals'],
    ['/deals/abc/terms', 2, '/deals/abc'],
    ['/deals/abc/terms', 3, '/deals/abc/terms'],
    // Asking for more than there is yields what there is, rather than
    // inventing empty segments.
    ['/deals', 5, '/deals'],
  ])('%s prefixed to %i segments is %s', (path, segments, expected) => {
    expect(prefixPath(path, segments)).toBe(expected);
  });
});

describe('hasVariableLengthParams', () => {
  it.each([
    ['/deals/:id', false],
    ['/invoices/:id(\\d+)', false],
    ['/files/:path+', true],
    ['/files/:path*', true],
    ['/:pathMatch(.*)*', true],
  ])('%s -> %s', (pattern, expected) => {
    expect(hasVariableLengthParams(pattern)).toBe(expected);
  });
});
