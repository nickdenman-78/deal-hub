import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { effectScope } from 'vue';
import { __resetFocusOriginForTests, useFocusOrigin } from './useFocusOrigin';

/*
 * The case this exists for: a click that does NOT focus what it hits. Safari
 * does not focus <button> on click, and a component can preventDefault on
 * mousedown for its own reasons. document.activeElement is then still <body>
 * when an overlay opens, so the overlay records no trigger and closing it
 * strands the reader at the top of the document.
 */
let scope: ReturnType<typeof effectScope>;

function withOrigin<T>(fn: (origin: ReturnType<typeof useFocusOrigin>) => T): T {
  return scope.run(() => fn(useFocusOrigin()))!;
}

beforeEach(() => {
  __resetFocusOriginForTests();
  document.body.innerHTML = '';
  scope = effectScope();
});

afterEach(() => {
  scope.stop();
});

describe('resolve', () => {
  it('prefers the focused element when there is one', () => {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();

    expect(withOrigin((o) => o.resolve())).toBe(button);
  });

  it('falls back to the last pointerdown target when nothing is focused', () => {
    const button = document.createElement('button');
    document.body.append(button);

    withOrigin((origin) => {
      // Exactly the Safari case: the pointer went down on the button, but the
      // browser left focus on <body>.
      button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      expect(document.activeElement).toBe(document.body);
      expect(origin.resolve()).toBe(button);
    });
  });

  it('walks up to the nearest control from a pointerdown on inner markup', () => {
    document.body.innerHTML = '<button id="trigger"><span id="label">Open</span></button>';
    const label = document.getElementById('label')!;

    withOrigin((origin) => {
      label.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      expect(origin.resolve()?.id).toBe('trigger');
    });
  });

  it('is null when the pointer went down on nothing interactive', () => {
    document.body.innerHTML = '<div id="plain">text</div>';

    withOrigin((origin) => {
      document.getElementById('plain')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      expect(origin.resolve()).toBeNull();
    });
  });

  it('ignores <body> as a focused element', () => {
    withOrigin((origin) => {
      document.body.focus();
      expect(origin.resolve()).toBeNull();
    });
  });
});

describe('restore', () => {
  it('returns focus to the trigger', () => {
    const button = document.createElement('button');
    const other = document.createElement('input');
    document.body.append(button, other);
    other.focus();

    withOrigin((o) => o.restore(button));
    expect(document.activeElement).toBe(button);
  });

  it('does nothing for an element that has left the document', () => {
    const button = document.createElement('button');
    const survivor = document.createElement('input');
    document.body.append(button, survivor);
    survivor.focus();
    button.remove();

    // A blade closing can take the trigger with it. Focusing a detached node
    // silently moves focus to <body>, which is worse than leaving it alone.
    withOrigin((o) => o.restore(button));
    expect(document.activeElement).toBe(survivor);
  });

  it('tolerates null', () => {
    expect(() => withOrigin((o) => o.restore(null))).not.toThrow();
  });
});

describe('listener lifetime', () => {
  it('stops tracking once every scope using it has gone', () => {
    const button = document.createElement('button');
    document.body.append(button);

    const origin = scope.run(() => useFocusOrigin())!;
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(origin.resolve()).toBe(button);

    scope.stop();

    // The shared listener is gone, so nothing new is recorded.
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(origin.resolve()).toBeNull();
  });
});
