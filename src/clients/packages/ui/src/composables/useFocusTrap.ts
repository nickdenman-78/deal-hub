/**
 * Focus helpers for overlays and composite fields.
 *
 * `trapTab` keeps Tab inside a container — only needed for overlays that are
 * NOT a native modal <dialog>. A dialog opened with showModal() goes into the
 * top layer and the browser enforces the trap itself — Dialog and ConfirmDialog
 * get this for free and must not use this. Drawer and BladeAside are ordinary
 * elements, so the trap is ours.
 *
 * `focusAdjacent` is the opposite problem: treat a composite control (a date
 * input with several dateparts) as ONE tab stop, matching Edge / the APG
 * "arrows within, Tab leaves" pattern when Chrome would otherwise Tab between
 * parts.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Focusable descendants, in tab order, skipping anything hidden.
 *
 * Visibility is judged with getComputedStyle, NOT `offsetParent !== null`. The
 * offsetParent trick is the usual shorthand, but it is null for every element
 * in jsdom — there is no layout engine — so the filter silently removes
 * everything and the trap decides the container has nothing focusable in it.
 * That fails in tests while working in a browser, which is the worst way round.
 */
export function focusablesIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => {
    // tabindex=-1 is programmatically focusable only — the button selector
    // above would otherwise pull those in and invent tab stops (e.g. the
    // DatePicker's calendar affordance).
    if (element.getAttribute('tabindex') === '-1') return false;
    // A collapsed section's controls are in the DOM but unreachable, and
    // treating one as the first or last item would wrap focus onto something
    // invisible.
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Moves focus to the next (or previous) focusable in `scope` after `from`.
 * Returns whether focus moved. Used to make a composite field a single tab stop.
 */
export function focusAdjacent(from: HTMLElement, scope: HTMLElement, backward: boolean): boolean {
  const items = focusablesIn(scope);
  const index = items.indexOf(from);
  if (index === -1) return false;
  const next = items[backward ? index - 1 : index + 1];
  if (!next) return false;
  next.focus();
  return true;
}

/**
 * Handles a keydown, wrapping Tab within `container`.
 *
 * The subtle case, and the one a naive trap gets wrong: focus is often NOT on
 * the first or last focusable. It lands on the container itself whenever
 * someone clicks a non-focusable area — prose, padding, a heading — because
 * these panels carry `tabindex="-1"` so that click does not dump focus on
 * <body>. A trap that only intercepts at the two ends does nothing there, and
 * Shift+Tab walks straight out of the panel into the page behind, which is
 * precisely what a modal overlay must not allow.
 *
 * So: anything not in the list is treated as "just outside" — Tab enters at the
 * first item, Shift+Tab at the last.
 */
export function trapTab(event: KeyboardEvent, container: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return;

  const items = focusablesIn(container);

  // Nothing focusable inside: hold focus on the container rather than letting
  // Tab wander off into the page.
  if (items.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];
  const index = items.indexOf(document.activeElement as HTMLElement);

  if (index === -1) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  if (event.shiftKey && index === 0) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && index === items.length - 1) {
    event.preventDefault();
    first.focus();
  }
  // Anywhere in the middle is the browser's own order, which is the one to keep.
}
