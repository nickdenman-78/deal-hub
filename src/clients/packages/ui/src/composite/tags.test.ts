import { describe, expect, it } from 'vitest';
import { addTags, containsTag, normalizeTag, removeTag, splitTags, tagError } from './tags';

describe('splitTags', () => {
  it('splits on the separators a list actually arrives with', () => {
    expect(splitTags('a,b;c\nd\te')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  /*
   * NOT space. "east coast" and "needs review" are ordinary tags, and splitting
   * on space shreds them into halves with no way to type the original back.
   */
  it('does not split on spaces', () => {
    expect(splitTags('east coast, needs review')).toEqual(['east coast', 'needs review']);
  });

  it('drops empties from trailing and doubled separators', () => {
    expect(splitTags('a,,b,')).toEqual(['a', 'b']);
    expect(splitTags('   ')).toEqual([]);
  });
});

describe('normalizeTag', () => {
  it('trims and collapses inner whitespace', () => {
    expect(normalizeTag('  east   coast  ')).toBe('east coast');
  });

  it('folds case only when asked', () => {
    expect(normalizeTag('Prod')).toBe('Prod');
    expect(normalizeTag('Prod', { lowercase: true })).toBe('prod');
  });
});

describe('containsTag', () => {
  it('is case-sensitive by default and not when told otherwise', () => {
    expect(containsTag(['Prod'], 'prod')).toBe(false);
    expect(containsTag(['Prod'], 'prod', { caseInsensitive: true })).toBe(true);
  });
});

describe('addTags', () => {
  it('adds a single tag', () => {
    expect(addTags(['a'], 'b').tags).toEqual(['a', 'b']);
  });

  it('splits a pasted list into many', () => {
    expect(addTags([], 'a, b, c').tags).toEqual(['a', 'b', 'c']);
  });

  /*
   * Checked against the GROWING list, not the original — otherwise a paste
   * containing the same tag twice adds it twice, and the field ends up in a
   * state its own rules say is impossible.
   */
  it('collapses repeats within one paste', () => {
    const result = addTags([], 'a, b, a');
    expect(result.tags).toEqual(['a', 'b']);
    expect(result.rejected).toEqual([{ tag: 'a', reason: 'Already added.' }]);
  });

  /*
   * Reporting rejections is the point. Pasting thirty tags and getting
   * twenty-six looks exactly like the paste not working, unless something says
   * which four were refused and why.
   */
  it('reports every rejection with its reason', () => {
    const result = addTags(['keep'], 'keep, way-too-long, fine', { maxLength: 8 });
    expect(result.added).toEqual(['fine']);
    expect(result.rejected).toEqual([
      { tag: 'keep', reason: 'Already added.' },
      { tag: 'way-too-long', reason: 'Keep it to 8 characters.' },
    ]);
  });

  it('applies a pattern with the caller’s message', () => {
    const rules = { pattern: /^[a-z-]+$/, patternMessage: 'Lower case and hyphens only.' };
    const result = addTags([], 'Prod', rules);
    expect(result.tags).toEqual([]);
    expect(result.rejected[0]?.reason).toBe('Lower case and hyphens only.');
  });

  it('does not mutate the array it was given', () => {
    const original = ['a'];
    addTags(original, 'b');
    expect(original).toEqual(['a']);
  });

  it('normalises on the way in', () => {
    expect(addTags([], '  Spaced   Out  ').tags).toEqual(['Spaced Out']);
    expect(addTags([], 'Prod', { lowercase: true }).tags).toEqual(['prod']);
  });
});

describe('tagError', () => {
  it('says nothing about an empty input, which is not an error but nothing to add', () => {
    expect(tagError('', [])).toBeUndefined();
  });

  it('catches a duplicate', () => {
    expect(tagError('a', ['a'])).toBe('Already added.');
  });
});

describe('removeTag', () => {
  it('removes by the same comparison used to add', () => {
    expect(removeTag(['Prod', 'dev'], 'prod')).toEqual(['Prod', 'dev']);
    expect(removeTag(['Prod', 'dev'], 'prod', { caseInsensitive: true })).toEqual(['dev']);
  });
});
