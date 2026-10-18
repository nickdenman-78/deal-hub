/**
 * Default CSS `position-try-fallbacks` for v0 Popover / Menu panels.
 *
 * Prefer the declared `position-area`; if that overflows the viewport, flip on
 * the block axis (below → above), then the inline axis, then both — the same
 * behaviour Floating UI's `flip` middleware provides, without a JS measurer.
 *
 * v0's own default (`most-width bottom`) is not a valid try-tactic list and
 * does not flip near the bottom edge.
 */
export const POPOVER_POSITION_TRY = 'flip-block, flip-inline, flip-block flip-inline';
