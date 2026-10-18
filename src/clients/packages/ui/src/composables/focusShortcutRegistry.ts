/**
 * Shared Ctrl/Cmd+K (and `/`) focus targets.
 *
 * Controls opt in via the `focusShortcut` prop; list screens can also register
 * a template ref through `useFilterShortcut`. Either path lands here so one
 * document listener owns the shortcut and cycles when several targets exist.
 *
 * Targets are focused in document order, not registration order, so a filter
 * bar that remounts mid-row still cycles left-to-right.
 */

export type FocusShortcutTarget = {
  /** Root element used for DOM ordering and "is focus inside this target?". */
  getElement: () => HTMLElement | null;
  focus: () => void;
};

type Entry = FocusShortcutTarget & { id: number };

const entries: Entry[] = [];
let nextId = 1;
let listening = false;

function isEditableActive(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  // Covers contenteditable surfaces, including Monaco's hidden textarea's
  // container — typing `/` in a JSON editor must not jump to a filter box.
  if (el.isContentEditable) return true;
  return false;
}

function sortedEntries(): Entry[] {
  return [...entries].sort((a, b) => {
    const ea = a.getElement();
    const eb = b.getElement();
    if (!ea || !eb) return 0;
    const pos = ea.compareDocumentPosition(eb);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

function focusNext(): void {
  const list = sortedEntries().filter((entry) => entry.getElement());
  if (list.length === 0) return;

  const active = document.activeElement;
  const current = list.findIndex((entry) => {
    const root = entry.getElement();
    return root !== null && active instanceof Node && root.contains(active);
  });
  const next = current === -1 ? 0 : (current + 1) % list.length;
  list[next]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  // Ctrl/Cmd+K, and no other modifier. Shift+Ctrl+K is a different browser
  // shortcut in several browsers, so it must not match.
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
    if (entries.length === 0) return;
    event.preventDefault();
    focusNext();
    return;
  }

  // `/` — GitHub / Slack / YouTube. Yield while typing in another field.
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    if (entries.length === 0 || isEditableActive()) return;
    event.preventDefault();
    focusNext();
  }
}

function ensureListener(): void {
  if (listening) return;
  window.addEventListener('keydown', onKeydown);
  listening = true;
}

function releaseListener(): void {
  if (!listening || entries.length > 0) return;
  window.removeEventListener('keydown', onKeydown);
  listening = false;
}

/** Register a focus target. Returns an unregister function. */
export function registerFocusShortcut(target: FocusShortcutTarget): () => void {
  const entry: Entry = { id: nextId++, ...target };
  entries.push(entry);
  ensureListener();
  return () => {
    const index = entries.findIndex((item) => item.id === entry.id);
    if (index !== -1) entries.splice(index, 1);
    releaseListener();
  };
}

/** Test seam — drop every target and the window listener between cases. */
export function resetFocusShortcutRegistry(): void {
  entries.length = 0;
  if (listening) {
    window.removeEventListener('keydown', onKeydown);
    listening = false;
  }
}
