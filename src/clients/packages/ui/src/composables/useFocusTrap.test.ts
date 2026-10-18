import { beforeEach, describe, expect, it, vi } from 'vitest';
import { focusablesIn, focusAdjacent, trapTab } from './useFocusTrap';

/*
 * The bug this exists for, reproduced in a real browser before the fix:
 * with focus on a modal drawer's ROOT — where it lands whenever someone clicks
 * prose or padding inside, because the root carries tabindex="-1" — Shift+Tab
 * walked straight out of the panel and onto a button on the page behind.
 *
 * A trap that only intercepts at the first and last focusable does nothing in
 * that position, and that position is common.
 */
let panel: HTMLElement;
let outside: HTMLButtonElement;

function tab(shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
  vi.spyOn(event, 'preventDefault');
  trapTab(event, panel);
  return event;
}

beforeEach(() => {
  document.body.innerHTML = `
    <button id="before">Before</button>
    <div id="panel" tabindex="-1">
      <button id="close">Close</button>
      <input id="field" />
      <button id="save">Save</button>
    </div>
    <button id="after">After</button>
  `;
  panel = document.getElementById('panel')!;
  outside = document.getElementById('after') as HTMLButtonElement;
});

describe('focusablesIn', () => {
  it('finds focusable descendants in tab order', () => {
    expect(focusablesIn(panel).map((e) => e.id)).toEqual(['close', 'field', 'save']);
  });

  it('skips disabled controls', () => {
    (document.getElementById('field') as HTMLInputElement).disabled = true;
    expect(focusablesIn(panel).map((e) => e.id)).toEqual(['close', 'save']);
  });

  it('skips tabindex=-1 controls', () => {
    document.getElementById('close')!.tabIndex = -1;
    expect(focusablesIn(panel).map((e) => e.id)).toEqual(['field', 'save']);
  });
});

describe('trapTab', () => {
  it('wraps forward from the last item to the first', () => {
    document.getElementById('save')!.focus();
    const event = tab();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('close');
  });

  it('wraps backward from the first item to the last', () => {
    document.getElementById('close')!.focus();
    const event = tab(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('save');
  });

  it('leaves the middle of the list to the browser', () => {
    document.getElementById('field')!.focus();
    const event = tab();
    expect(event.preventDefault).not.toHaveBeenCalled();
    // Untouched — the browser's own order is the one to keep.
    expect(document.activeElement?.id).toBe('field');
  });

  /* The regression. Focus on the container itself is NOT the first or last
     focusable, so an ends-only trap ignores it and Shift+Tab escapes. */
  it('enters at the last item when Shift+Tab is pressed on the container', () => {
    panel.focus();
    expect(document.activeElement).toBe(panel);

    const event = tab(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('save');
  });

  it('enters at the first item when Tab is pressed on the container', () => {
    panel.focus();
    const event = tab();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('close');
  });

  it('pulls focus back in when it is somehow already outside', () => {
    outside.focus();
    const event = tab();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it('holds focus on the container when nothing inside is focusable', () => {
    panel.innerHTML = '<p>Just prose.</p>';
    panel.focus();

    const event = tab();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(panel);
  });

  it('ignores keys that are not Tab', () => {
    document.getElementById('save')!.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    vi.spyOn(event, 'preventDefault');
    trapTab(event, panel);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('does nothing without a container', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    expect(() => trapTab(event, null)).not.toThrow();
  });
});

describe('focusAdjacent', () => {
  it('moves forward to the next focusable in scope', () => {
    document.getElementById('field')!.focus();
    expect(focusAdjacent(document.getElementById('field')!, panel, false)).toBe(true);
    expect(document.activeElement?.id).toBe('save');
  });

  it('moves backward to the previous focusable in scope', () => {
    document.getElementById('field')!.focus();
    expect(focusAdjacent(document.getElementById('field')!, panel, true)).toBe(true);
    expect(document.activeElement?.id).toBe('close');
  });

  it('returns false at the end of the scope', () => {
    const save = document.getElementById('save')!;
    save.focus();
    expect(focusAdjacent(save, panel, false)).toBe(false);
    expect(document.activeElement).toBe(save);
  });
});
