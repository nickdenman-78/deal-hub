/**
 * Path arithmetic for the blade stack.
 *
 * A blade needs to know its own resolved path. React Router gets this from
 * useResolvedPath('.'); vue-router has no equivalent, and the obvious
 * substitutes all fail: router.resolve({ name, params }) requires every blade
 * route to be named and warns on every call about the child params it
 * discards; inject(matchedRouteKey) is marked @internal; and
 * route.matched[depth] breaks the moment a layout record renders no blade.
 *
 * So a blade derives its path by counting segments instead. Its matched record
 * carries an absolute pattern (vue-router normalises children), and the first
 * N segments of the current path are exactly the part that record consumed.
 * Nothing is parsed, so this is correct for static segments, for :param, and
 * for custom-regex params like :id(\d+) alike.
 */

/** True when `path` is `base` itself or something inside it. */
export function isPathWithin(base: string, path: string): boolean {
  const b = trimTrailingSlash(base);
  const p = trimTrailingSlash(path);
  return p === b || p.startsWith(`${b}/`);
}

/**
 * How many path segments a route *pattern* consumes.
 *
 * '/deals/:id' is 2, '/' is 0. Variable-length params (:id+, :id*, a
 * catch-all) break the assumption that this is a constant, which is why
 * hasVariableLengthParams exists.
 */
export function segmentCount(pattern: string): number {
  return pattern.split('/').filter(Boolean).length;
}

/** The first `segments` segments of `fullPath`, as an absolute path. */
export function prefixPath(fullPath: string, segments: number): string {
  const parts = fullPath.split('/').filter(Boolean).slice(0, segments);
  return `/${parts.join('/')}`;
}

/**
 * Patterns whose segment count is not fixed, and which therefore cannot have
 * their path derived by prefixing. Exported for the dev-only assertion in
 * Blade.vue.
 *
 * This is a real constraint on route design: a blade route cannot use :id+,
 * :id* or a catch-all. Worth knowing before laying out a screen.
 */
export function hasVariableLengthParams(pattern: string): boolean {
  // The custom-regex group goes first. A `+` or `*` inside one — :id(\d+),
  // :rest(.*) — is a quantifier on the regex, not a repeat modifier on the
  // param, and the segment count is still fixed. Only what survives the strip
  // can widen a route.
  return /[+*]/.test(pattern.replace(/\([^)]*\)/g, ''));
}

/**
 * '/' normalises to '', which is what makes the root a prefix of everything:
 * '' + '/' is the prefix every absolute path starts with. Leaving it as '/'
 * would compare against '//' and a root blade would think every drill-down had
 * left it.
 */
function trimTrailingSlash(path: string): string {
  return path.replace(/\/+$/, '');
}
