/*
 * jsdom has no layout engine, and ProseMirror asks it for one.
 *
 * `chain().focus()` ends in scrollToSelection → coordsAtPos → singleRect, which
 * calls getClientRects() on a Range. jsdom does not implement it, so the call
 * throws — asynchronously, inside ProseMirror's dispatch, where no test can
 * catch it. Every assertion still passed and vitest still failed the run, on an
 * unhandled error naming whichever test happened to be in flight.
 *
 * A zero rect is the right stub rather than a plausible one: nothing here tests
 * geometry (that lives in apps/ui-showcase, against a real browser), so the
 * only job is to let the measuring code complete without inventing coordinates
 * a test might then be written against.
 */
const ZERO: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
  toJSON: () => ({}),
};

const emptyList = (): DOMRectList => {
  const list = [ZERO] as unknown as DOMRectList & DOMRect[];
  list.item = (index: number) => list[index] ?? null;
  return list;
};

Range.prototype.getClientRects = emptyList;
Range.prototype.getBoundingClientRect = () => ZERO;
Element.prototype.getClientRects ??= emptyList;
