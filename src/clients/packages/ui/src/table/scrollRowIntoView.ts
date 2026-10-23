/**
 * Scroll `row` into view within its nearest *vertically* scrollable ancestor.
 *
 * Deliberately not Element.scrollIntoView(): that is specified to scroll every
 * scrollable ancestor until the element is visible in each, which here would
 * also move the blade strip sideways — a horizontal container whose scroll
 * position the stack owns and is actively animating. The user would see the
 * whole stack lurch because a row came into view.
 *
 * So: find one scroller, write only scrollTop, and only when the row is
 * actually outside it. A row already visible produces no movement at all,
 * which scrollIntoView cannot promise.
 */
export function scrollRowIntoView(row: HTMLElement): void {
  let scroller = row.parentElement;
  while (scroller) {
    const { overflowY } = getComputedStyle(scroller);
    // Both conditions matter: an `overflow-y: auto` box that fits its content
    // is not scrolling anything, and stopping there would silently do nothing.
    if (/(auto|scroll)/.test(overflowY) && scroller.scrollHeight > scroller.clientHeight) break;
    scroller = scroller.parentElement;
  }
  if (!scroller) return;

  const rowRect = row.getBoundingClientRect();
  const viewRect = scroller.getBoundingClientRect();
  const margin = 8;

  if (rowRect.top < viewRect.top) {
    scroller.scrollTop += rowRect.top - viewRect.top - margin;
  } else if (rowRect.bottom > viewRect.bottom) {
    scroller.scrollTop += rowRect.bottom - viewRect.bottom + margin;
  }
}
