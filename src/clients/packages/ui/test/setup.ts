import { beforeEach } from 'vitest';

/*
 * jsdom polyfills for three platform APIs v0 and this package build on.
 *
 * These exist because jsdom has not implemented them, NOT to paper over
 * component behaviour — each one is a faithful-enough stand-in for what the
 * browser does, and anything depending on real layout or the top layer is
 * verified in apps/ui-showcase instead.
 */

// ── Web Storage ──────────────────────────────────────────────────────────────
// Not a jsdom gap: jsdom implements localStorage perfectly well. Node 26 ships
// its OWN experimental global `localStorage`, which resolves to `undefined`
// unless the process was started with `--localstorage-file`. Because vitest's
// jsdom environment copies the jsdom window onto an object that ALREADY has
// that own property, Node's undefined one wins and jsdom's never lands —
// `typeof localStorage === 'undefined'` inside a jsdom test, with no error to
// say why. Every persistence suite in this package failed on it at once, and
// each one looked like a bug in its own composable.
//
// The stand-in is a Storage, not a mock: real semantics, because the code under
// test depends on them. Values are coerced to strings and a missing key reads
// back as `null` — a composable that treats `null` as "never stored" and
// `undefined` as "storage unavailable" would otherwise be tested against the
// wrong one of the two.
//
// Property access (`storage.theme`) is deliberately not modelled; nothing in
// this package uses it, and a Proxy that did would hide a real API drift.
//
// Defined writable and configurable so `vi.stubGlobal` still works — the suites
// that assert "survives storage throwing" replace it outright.
class MemoryStorage implements Storage {
  #entries = new Map<string, string>();

  get length(): number {
    return this.#entries.size;
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.#entries.get(String(key)) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#entries.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.#entries.delete(String(key));
  }

  clear(): void {
    this.#entries.clear();
  }

  [name: string]: unknown;
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, name, {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}

// One store per test file is not enough — a key written by one test is still
// there for the next, and "first-ever visit" cases silently stop being that.
beforeEach(() => {
  // Not the module-scope instances: a suite may have swapped either global out.
  globalThis.localStorage?.clear?.();
  globalThis.sessionStorage?.clear?.();
});

// ── <dialog>.showModal() ─────────────────────────────────────────────────────
// jsdom implements the element but none of its methods, so v0's Dialog and
// AlertDialog throw "showModal is not a function" on open.
const dialog = globalThis.HTMLDialogElement?.prototype;

if (dialog && typeof dialog.showModal !== 'function') {
  dialog.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
    this.setAttribute('open', '');
  };
  dialog.show = function show(this: HTMLDialogElement) {
    this.open = true;
    this.setAttribute('open', '');
  };
  dialog.close = function close(this: HTMLDialogElement, returnValue?: string) {
    this.open = false;
    this.removeAttribute('open');
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}

// ── Popover API ──────────────────────────────────────────────────────────────
// v0's Popover (and therefore Select, Menu, Tooltip) uses showPopover() and
// tests `:popover-open`. jsdom has neither, and its selector engine THROWS on
// the unknown pseudo-class rather than returning false — which surfaces as
// "unknown pseudo-class selector ':popover-open'" from deep inside v0.
const element = globalThis.HTMLElement?.prototype;

if (element && typeof element.showPopover !== 'function') {
  const OPEN = new WeakSet<HTMLElement>();

  element.showPopover = function showPopover(this: HTMLElement) {
    OPEN.add(this);
    this.setAttribute('data-popover-open', '');
  };
  element.hidePopover = function hidePopover(this: HTMLElement) {
    OPEN.delete(this);
    this.removeAttribute('data-popover-open');
  };
  element.togglePopover = function togglePopover(this: HTMLElement, force?: boolean) {
    const next = force ?? !OPEN.has(this);
    if (next) this.showPopover();
    else this.hidePopover();
    return next;
  };

  // Answer `:popover-open` from the set above and hand everything else back to
  // jsdom, rather than letting it throw on a selector it does not know.
  const nativeMatches = element.matches;
  element.matches = function matches(this: HTMLElement, selectors: string) {
    if (selectors.includes(':popover-open')) return OPEN.has(this);
    return nativeMatches.call(this, selectors);
  };
}

// ── The Popover API — deliberately NOT polyfilled ───────────────────────────
// jsdom implements none of it, and v0's Popover (which Menu, Select,
// MultiSelect, Combobox and Tooltip all build on) depends on the whole loop:
// Popover.Activator has NO click handler, so the only thing that opens a panel
// is the browser acting on `popovertarget`, firing `toggle`, and v0 syncing its
// isOpen ref back from that event.
//
// A stand-in was written and abandoned: faking showPopover/hidePopover and the
// toggle event gets the attributes moving but not the top layer, the light
// dismissal or the anchor positioning, so the tests it enables assert a shape
// the browser never produces. Open/close behaviour for these components is
// verified in apps/ui-showcase instead — the same call this package already
// makes for Monaco. Tests here stick to what the DOM shows while closed.
