import { describe, expect, it } from 'vitest';
import type { BladeEntry } from './context';
import { ancestorOf, deepestClosableDepth, dirtyOffenders } from './registry';

function blade(partial: Partial<BladeEntry> & { depth: number; path: string }): BladeEntry {
  return {
    id: `blade-${partial.depth}`,
    title: `Blade ${partial.depth}`,
    dirty: false,
    closable: true,
    closeTo: undefined,
    ...partial,
  };
}

const stack = [
  blade({ depth: 0, path: '/deals', closable: false }),
  blade({ depth: 1, path: '/deals/a' }),
  blade({ depth: 2, path: '/deals/a/terms' }),
];

describe('ancestorOf', () => {
  it('finds the nearest shallower blade', () => {
    expect(ancestorOf(stack, 2)?.path).toBe('/deals/a');
    expect(ancestorOf(stack, 1)?.path).toBe('/deals');
  });

  it('has nothing to offer a root blade', () => {
    expect(ancestorOf(stack, 0)).toBeNull();
  });
});

describe('deepestClosableDepth', () => {
  it('is the deepest blade when that blade can close', () => {
    expect(deepestClosableDepth(stack)).toBe(2);
  });

  it('skips a display-only leaf, so Escape reaches the panel that can close', () => {
    const withDisplayLeaf = [...stack.slice(0, 2), blade({ depth: 2, path: '/deals/a/terms', closable: false })];
    expect(deepestClosableDepth(withDisplayLeaf)).toBe(1);
  });

  it('ignores a root blade even when it claims to be closable', () => {
    expect(deepestClosableDepth([blade({ depth: 0, path: '/deals' })])).toBe(-1);
  });

  it('is -1 for an empty stack', () => {
    expect(deepestClosableDepth([])).toBe(-1);
  });
});

describe('dirtyOffenders', () => {
  const dirty = [
    blade({ depth: 0, path: '/deals', closable: false }),
    blade({ depth: 1, path: '/deals/a', dirty: true }),
  ];

  it('says nothing when no blade is dirty', () => {
    expect(dirtyOffenders(stack, '/services')).toEqual([]);
  });

  it('stays silent while you move deeper into the dirty blade', () => {
    expect(dirtyOffenders(dirty, '/deals/a/terms')).toEqual([]);
  });

  it('objects when the destination leaves the dirty blade', () => {
    expect(dirtyOffenders(dirty, '/deals').map((b) => b.path)).toEqual(['/deals/a']);
    expect(dirtyOffenders(dirty, '/services').map((b) => b.path)).toEqual(['/deals/a']);
  });
});
