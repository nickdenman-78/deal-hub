import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { registerEtsIcons } from '../icons';
import MegaMenu from './MegaMenu.vue';
import { chunkColumns, edgeInBar, hasPanel, moveInBar, moveInGrid, resolveFlow, type MegaMenuEntry } from './megaMenu';

/*
 * The grid/bar arithmetic and the mounted component share a file because
 * Windows treats `megaMenu.test.ts` and `MegaMenu.test.ts` as one path — the
 * usual "pure logic gets its own sibling test" split is not available here.
 */

beforeAll(() => registerEtsIcons());

function plain(count: number) {
  return Array.from({ length: count }, (_, index) => ({ label: `item ${index}` }));
}

describe('chunkColumns', () => {
  it('fills down to maxRows before starting a new column', () => {
    const columns = chunkColumns(plain(7), 3);
    expect(columns.map((column) => column[0]!.items.length)).toEqual([3, 3, 1]);
    expect(columns[0]![0]!.items[0]!.label).toBe('item 0');
    expect(columns[1]![0]!.items[0]!.label).toBe('item 3');
  });

  /* A short list must not stretch to six rows of whitespace. */
  it('uses one column when the list is shorter than maxRows', () => {
    expect(chunkColumns(plain(2), 6)).toHaveLength(1);
  });

  it('has no columns for an empty list', () => {
    expect(chunkColumns([], 6)).toEqual([]);
  });
});

describe('moveInGrid', () => {
  const columns = [3, 5, 2];

  it('wraps up and down within a column, in column flow', () => {
    expect(moveInGrid(columns, { column: 0, row: 2 }, 'down')).toEqual({ column: 0, row: 0 });
    expect(moveInGrid(columns, { column: 0, row: 0 }, 'up')).toEqual({ column: 0, row: 2 });
  });

  /* Where the columns are one list reflowed for width, the bottom of column 1
     is the middle of the list — wrapping back to its top skips half of it. */
  it('runs on into the next column in list flow, wrapping only at the panel ends', () => {
    expect(moveInGrid(columns, { column: 0, row: 2 }, 'down', 'list')).toEqual({ column: 1, row: 0 });
    expect(moveInGrid(columns, { column: 1, row: 0 }, 'up', 'list')).toEqual({ column: 0, row: 2 });
    expect(moveInGrid(columns, { column: 2, row: 1 }, 'down', 'list')).toEqual({ column: 0, row: 0 });
    expect(moveInGrid(columns, { column: 0, row: 0 }, 'up', 'list')).toEqual({ column: 2, row: 1 });
  });

  it('skips empty columns in list flow too', () => {
    expect(moveInGrid([2, 0, 4], { column: 0, row: 1 }, 'down', 'list')).toEqual({ column: 2, row: 0 });
  });

  /* Sideways movement is by column whatever the flow — it is what makes a
     four-column panel navigable in two keystrokes rather than twenty. */
  it('keeps left and right moving by column in list flow', () => {
    expect(moveInGrid(columns, { column: 0, row: 1 }, 'right', 'list')).toEqual({ column: 1, row: 1 });
  });

  /* The eye moves to the nearest item in the next column, not nowhere. */
  it('clamps the row when the next column is shorter', () => {
    expect(moveInGrid(columns, { column: 1, row: 4 }, 'right')).toEqual({ column: 2, row: 1 });
  });

  it('wraps around the ends of the row of columns', () => {
    expect(moveInGrid(columns, { column: 2, row: 0 }, 'right')).toEqual({ column: 0, row: 0 });
    expect(moveInGrid(columns, { column: 0, row: 1 }, 'left')).toEqual({ column: 2, row: 1 });
  });

  it('skips empty columns when moving sideways', () => {
    expect(moveInGrid([2, 0, 4], { column: 0, row: 1 }, 'right')).toEqual({ column: 2, row: 1 });
  });

  it('enters at the first item when nothing is focused yet', () => {
    expect(moveInGrid(columns, { column: -1, row: 0 }, 'down')).toEqual({ column: 0, row: 0 });
  });

  it('takes first and last across the whole panel', () => {
    expect(moveInGrid(columns, { column: 1, row: 3 }, 'first')).toEqual({ column: 0, row: 0 });
    expect(moveInGrid(columns, { column: 0, row: 0 }, 'last')).toEqual({ column: 2, row: 1 });
  });

  it('has nowhere to go in an empty panel', () => {
    expect(moveInGrid([0, 0], { column: 0, row: 0 }, 'down')).toBeNull();
  });
});

describe('moveInBar', () => {
  const entries: MegaMenuEntry[] = [
    { label: 'One' },
    { label: 'Two', disabled: true },
    { label: 'Three' },
    { label: 'Four' },
  ];

  it('steps over disabled entries', () => {
    expect(moveInBar(entries, 0, 1)).toBe(2);
    expect(moveInBar(entries, 2, -1)).toBe(0);
  });

  it('wraps at both ends', () => {
    expect(moveInBar(entries, 3, 1)).toBe(0);
    expect(moveInBar(entries, 0, -1)).toBe(3);
  });

  /* Home and End are edges, not steps — they must not wrap past the ends. */
  it('takes the first and last enabled entry for the edges', () => {
    expect(edgeInBar(entries, 'first')).toBe(0);
    expect(edgeInBar(entries, 'last')).toBe(3);
    expect(edgeInBar([{ label: 'One', disabled: true }], 'first')).toBeNull();
  });
});

describe('resolveFlow', () => {
  const labelled: MegaMenuEntry = { label: 'A', columns: [[{ label: 'Positions', items: plain(2) }]] };
  const bare: MegaMenuEntry = { label: 'B', columns: chunkColumns(plain(9), 6) };

  it('reads groups off the labels when left on auto', () => {
    expect(resolveFlow(labelled, 'auto')).toBe('column');
    expect(resolveFlow(bare, 'auto')).toBe('list');
  });

  it('lets the caller override either way', () => {
    expect(resolveFlow(bare, 'column')).toBe('column');
    expect(resolveFlow(labelled, 'list')).toBe('list');
  });
});

describe('hasPanel', () => {
  it('separates panel triggers from plain commands', () => {
    expect(hasPanel({ label: 'Docs', href: '/docs' })).toBe(false);
    expect(hasPanel({ label: 'Docs', columns: [] })).toBe(false);
    expect(hasPanel({ label: 'Docs', columns: [[{ items: plain(1) }]] })).toBe(true);
  });
});

const action = vi.fn();

const model: MegaMenuEntry[] = [
  {
    label: 'Components',
    columns: [
      [{ label: 'Actions', items: [{ label: 'Button', action }, { label: 'Menu' }] }],
      [{ label: 'Forms', items: [{ label: 'Input' }, { label: 'Select', disabled: true }, { label: 'Switch' }] }],
    ],
  },
  { label: 'Patterns', columns: chunkColumns([{ label: 'Blade stack' }, { label: 'List page' }], 6) },
  { label: 'Docs', href: '/docs' },
];

function mountMenu() {
  return mount(MegaMenu, {
    props: { model, label: 'Main' },
    attachTo: document.body,
    global: { stubs: { RouterLink: { template: '<a><slot/></a>' } } },
  });
}

describe('MegaMenu', () => {
  it('is a menubar of roots, with the panel entries advertising their panel', () => {
    const wrapper = mountMenu();
    expect(wrapper.attributes('role')).toBe('menubar');
    expect(wrapper.attributes('aria-label')).toBe('Main');

    const roots = wrapper.findAll('.r-mega-menu__root');
    expect(roots).toHaveLength(3);
    expect(roots[0]!.attributes('aria-haspopup')).toBe('true');
    // A plain entry is a menuitem in its own right, not a trigger.
    expect(roots[2]!.attributes('aria-haspopup')).toBeUndefined();
    expect(roots[2]!.attributes('role')).toBe('menuitem');
  });

  /* The whole bar is ONE tab stop — arrows move within it, per the menubar
     pattern. Three tab stops for one control is the bug this guards. */
  it('keeps a single tab stop across the bar', () => {
    const roots = mountMenu().findAll('.r-mega-menu__root');
    expect(roots.map((root) => root.attributes('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('moves the tab stop with the arrow keys, wrapping at the end', async () => {
    const wrapper = mountMenu();
    const roots = wrapper.findAll('.r-mega-menu__root');

    await roots[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(roots[1]!.element);

    await roots[2]!.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(roots[0]!.element);

    await roots[0]!.trigger('keydown', { key: 'End' });
    expect(document.activeElement).toBe(roots[2]!.element);
  });

  it('opens on ArrowDown and lands on the first item of the panel', async () => {
    const wrapper = mountMenu();
    const root = wrapper.findAll('.r-mega-menu__root')[0]!;

    await root.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    const panel = wrapper.findAll('.r-mega-menu__panel')[0]!;
    expect(panel.attributes('data-popover-open')).toBeDefined();
    expect(document.activeElement).toBe(panel.findAll('[role="menuitem"]')[0]!.element);
  });

  it('walks the panel grid, skipping disabled items and clamping short columns', async () => {
    const wrapper = mountMenu();
    const root = wrapper.findAll('.r-mega-menu__root')[0]!;
    await root.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    const panel = wrapper.findAll('.r-mega-menu__panel')[0]!;
    const label = () => document.activeElement?.textContent?.trim();

    await panel.trigger('keydown', { key: 'ArrowDown' });
    expect(label()).toBe('Menu');

    await panel.trigger('keydown', { key: 'ArrowRight' });
    // Second column, row clamped from 1 — and 'Select' is disabled, so the
    // actionable rows there are Input / Switch.
    expect(label()).toBe('Switch');

    await panel.trigger('keydown', { key: 'End' });
    expect(label()).toBe('Switch');

    await panel.trigger('keydown', { key: 'Home' });
    expect(label()).toBe('Button');
  });

  it('closes on Escape and hands focus back to the trigger', async () => {
    const wrapper = mountMenu();
    const root = wrapper.findAll('.r-mega-menu__root')[0]!;
    await root.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    const panel = wrapper.findAll('.r-mega-menu__panel')[0]!;
    await panel.trigger('keydown', { key: 'Escape' });
    await nextTick();

    expect(panel.attributes('data-popover-open')).toBeUndefined();
    expect(document.activeElement).toBe(root.element);
  });

  it('closes before running an item action, so the action owns focus', async () => {
    const wrapper = mountMenu();
    const root = wrapper.findAll('.r-mega-menu__root')[0]!;
    await root.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    const panel = wrapper.findAll('.r-mega-menu__panel')[0]!;
    await panel.findAll('[role="menuitem"]')[0]!.trigger('click');
    await nextTick();

    expect(panel.attributes('data-popover-open')).toBeUndefined();
    expect(action).toHaveBeenCalledOnce();
    expect(wrapper.emitted('select')).toHaveLength(1);
  });

  /* The panel itself must carry NO layout: the UA hides a closed popover with
     `display: none`, and any author `display` on the panel outranks it — every
     panel then renders permanently open and unanchored. jsdom has no UA
     stylesheet to catch that, so this pins the structure the fix relies on. */
  it('lays the columns out on a wrapper inside the panel, not on the panel', () => {
    const panel = mountMenu().findAll('.r-mega-menu__panel')[0]!;
    expect(panel.attributes('popover')).toBeDefined();
    expect(panel.element.children).toHaveLength(1);
    expect(panel.element.children[0]!.className).toBe('r-mega-menu__columns');
  });

  it('labels each group and hangs its items off that label', () => {
    const wrapper = mountMenu();
    const group = wrapper.findAll('.r-mega-menu__panel')[0]!.findAll('[role="group"]')[0]!;
    const heading = wrapper.findAll('.r-mega-menu__group-label')[0]!;
    expect(heading.text()).toBe('Actions');
    expect(group.attributes('aria-labelledby')).toBe(heading.attributes('id'));
  });

  /* An unnamed group announces a boundary and says nothing about it. The
     chunked panel is one list, so its columns claim no grouping at all. */
  it('claims no grouping for unlabelled columns', () => {
    const panels = mountMenu().findAll('.r-mega-menu__panel');
    const chunked = panels[1]!.findAll('.r-mega-menu__list');
    expect(chunked.map((list) => list.attributes('role'))).toEqual(['none']);
    expect(panels[0]!.findAll('.r-mega-menu__list').map((list) => list.attributes('role'))).toEqual(['group', 'group']);
  });
});
