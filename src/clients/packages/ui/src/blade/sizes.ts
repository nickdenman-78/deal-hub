/**
 * Panel widths. The fixed sizes cap themselves; only `fill` grows, and it is
 * bounded in CSS — on a very wide screen the extra width lands in whichever
 * column stretches, so a row's first cell and its last drift a screen apart.
 *
 * The values live in @ets/brand as --blade-sm/md/lg/xl/fill-max.
 */
export const BLADE_SIZES = ['sm', 'md', 'lg', 'xl', 'fill'] as const;

export type BladeSize = (typeof BLADE_SIZES)[number];

/**
 * Floor for a panel's width, as a size step.
 *
 * `fill` is excluded because a floor of "whatever is left" is not a floor. The
 * point is a blade that flexes but never collapses below a width its content is
 * usable at — a workbench pinned at `xl`, say, while still growing into a wide
 * screen. On a fixed-size blade a min only bites when it is *larger* than the
 * size, which is a contradiction worth avoiding rather than a feature.
 */
export const BLADE_MIN_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

export type BladeMinSize = (typeof BLADE_MIN_SIZES)[number];

/**
 * Aside panel widths. Narrower than blades — a settings drawer, not a workspace
 * column. `md` is the historical 21rem default; `fill` does not apply here.
 */
export const BLADE_ASIDE_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

export type BladeAsideSize = (typeof BLADE_ASIDE_SIZES)[number];
