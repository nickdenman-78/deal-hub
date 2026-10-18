import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FEATURES,
  buildTools,
  isAllowedLinkUri,
  selectTools,
  tidySeparators,
  type MarkdownToolSpec,
} from './tools';

const noEditor = () => undefined;
const noop = () => {};

const build = (features: Partial<typeof DEFAULT_FEATURES> = {}) =>
  buildTools(noEditor, { ...DEFAULT_FEATURES, ...features }, noop);

const ids = (tools: MarkdownToolSpec[]) => tools.map((tool) => tool.id);

describe('isAllowedLinkUri', () => {
  /*
   * The security half. This predicate is the ONLY thing standing between an
   * author-supplied string and a link mark, and it is shared by the Link
   * extension and the link dialog so the two cannot disagree about what is
   * acceptable.
   */
  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:msgbox', 'file:///etc/passwd'])(
    'refuses %s',
    (uri) => {
      expect(isAllowedLinkUri(uri)).toBe(false);
    },
  );

  it.each(['https://example.com', 'http://example.com/x?y=1', 'mailto:ops@example.com'])('allows %s', (uri) => {
    expect(isAllowedLinkUri(uri)).toBe(true);
  });

  // A bare host is the common case, and it is only valid because it resolves
  // against the default protocol — which is why the dialog can validate live
  // without flagging a half-typed address.
  it('resolves a protocol-less address against the default protocol', () => {
    expect(isAllowedLinkUri('example.com')).toBe(true);
    expect(isAllowedLinkUri('example.com', 'ftp')).toBe(false);
  });
});

describe('buildTools', () => {
  it('offers undo and redo, as actions rather than toggles', () => {
    const undo = build().find((tool) => tool.id === 'undo');
    expect(undo?.kind).toBe('action');
    // No editor yet: can() is unanswerable, so the button must be disabled
    // rather than clickable and inert.
    expect(undo?.disabled()).toBe(true);
    expect(undo?.active()).toBe(false);
  });

  it('drops undo and redo when history is off', () => {
    expect(ids(build({ history: false }))).not.toContain('undo');
    expect(ids(build({ history: false }))).not.toContain('redo');
  });

  it('emits one button per configured heading level', () => {
    expect(ids(build({ headings: [1, 2, 3] }))).toEqual(expect.arrayContaining(['heading1', 'heading2', 'heading3']));
    expect(ids(build({ headings: false })).some((id) => id.startsWith('heading'))).toBe(false);
  });

  it('treats link as a toggle, because it reports whether the caret is in one', () => {
    expect(build().find((tool) => tool.id === 'link')?.kind).toBe('toggle');
  });
});

describe('selectTools', () => {
  it('groups the default order with separators', () => {
    const selected = selectTools(build(), true);
    expect(ids(selected).filter((id) => id === 'divider').length).toBeGreaterThan(0);
    expect(ids(selected).indexOf('undo')).toBeLessThan(ids(selected).indexOf('bold'));
  });

  /*
   * The reason selection filters against `available` rather than trusting the
   * caller: a feature that is off is not in the schema, so the button would be
   * present and dead.
   */
  it('will not resurrect a tool its features disabled', () => {
    const available = build({ headings: false, code: false });
    expect(ids(selectTools(available, ['heading2', 'code', 'bold']))).toEqual(['bold']);
  });

  it('honours an explicit order, including dividers', () => {
    expect(ids(selectTools(build(), ['italic', 'divider', 'bold']))).toEqual(['italic', 'divider', 'bold']);
  });

  it('returns nothing when the toolbar is off', () => {
    expect(selectTools(build(), false)).toEqual([]);
  });
});

describe('tidySeparators', () => {
  // Otherwise filtering a subset out of a grouped list — which is exactly what
  // the bubble menu does to drop undo/redo — leaves a rule floating at the edge.
  it('drops leading, trailing and doubled separators', () => {
    const tools = tidySeparators(selectTools(build(), ['divider', 'bold', 'divider', 'divider', 'italic', 'divider']));
    expect(ids(tools)).toEqual(['bold', 'divider', 'italic']);
  });
});
