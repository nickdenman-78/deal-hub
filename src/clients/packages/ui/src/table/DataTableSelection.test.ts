/*
 * DataTable `v-model:selected` + row expansion. Selection lives in the
 * component (not v0's selectStrategy) so filtered-out selections survive —
 * that survival is asserted here because it is the reason for the design.
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import DataTable from './DataTable.vue';
import type { DataTableColumn } from './types';

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: 'a', name: 'alpha' },
  { id: 'b', name: 'beta' },
  { id: 'c', name: 'gamma' },
];

const COLUMNS: DataTableColumn<Row>[] = [{ id: 'name', header: 'Name', field: 'name', filterable: true }];

const BASE = { rows: ROWS, columns: COLUMNS, rowId: (r: Row) => r.id };

describe('DataTable selection', () => {
  it('renders no checkbox column unless selectable', () => {
    const wrapper = mount(DataTable<Row>, { props: BASE });

    expect(wrapper.find('.r-table__checkbox').exists()).toBe(false);
  });

  it('reports a row tick through v-model:selected without activating the row', async () => {
    const wrapper = mount(DataTable<Row>, {
      props: { ...BASE, selectable: true, selected: [], rowHref: () => '/x' },
    });

    const boxes = wrapper.findAll('tbody .r-table__checkbox');
    expect(boxes).toHaveLength(3);

    await boxes[1]!.setValue(true);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['b']]);
    expect(wrapper.emitted('rowActivate')).toBeUndefined();
  });

  it('select-all ticks every visible row; a second click clears them', async () => {
    const wrapper = mount(DataTable<Row>, { props: { ...BASE, selectable: true, selected: [] } });

    const header = wrapper.find('thead .r-table__checkbox');
    await header.setValue(true);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['a', 'b', 'c']]);

    await wrapper.setProps({ selected: ['a', 'b', 'c'] });
    await header.setValue(false);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([[]]);
  });

  it('keeps filtered-out selections when select-all works on the narrowed view', async () => {
    const wrapper = mount(DataTable<Row>, {
      props: { ...BASE, selectable: true, selected: ['c'], search: 'alpha' },
    });
    await nextTick();

    expect(wrapper.findAll('tbody tr[data-row]')).toHaveLength(1); // alpha only

    await wrapper.find('thead .r-table__checkbox').setValue(true);
    const last = wrapper.emitted('update:selected')?.at(-1) as [Array<string>];
    expect(last[0]).toEqual(expect.arrayContaining(['c', 'a'])); // c untouched
  });

  it('marks selected rows for styling', () => {
    const wrapper = mount(DataTable<Row>, { props: { ...BASE, selectable: true, selected: ['a'] } });

    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(1);
  });

  /* A locked entry must not join a bulk action because the header box was
     ticked — rowSelectable disables its checkbox AND excludes it from
     select-all. */
  it('rowSelectable rows are disabled and skipped by select-all', async () => {
    const wrapper = mount(DataTable<Row>, {
      props: { ...BASE, selectable: true, selected: [], rowSelectable: (r: Row) => r.id !== 'b' },
    });

    const boxes = wrapper.findAll('tbody .r-table__checkbox');
    expect(boxes.map((b) => (b.element as HTMLInputElement).disabled)).toEqual([false, true, false]);

    await wrapper.find('thead .r-table__checkbox').setValue(true);
    expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['a', 'c']]);
  });
});

describe('DataTable expansion', () => {
  it('toggles a full-width disclosure row rendered from the #expanded slot', async () => {
    const wrapper = mount(DataTable<Row>, {
      props: { ...BASE, expandable: true, expanded: [] },
      slots: { expanded: `<template #expanded="{ row }"><em class="detail">{{ row.name }}</em></template>` },
    });

    expect(wrapper.find('.r-table__expansion').exists()).toBe(false);

    await wrapper.find('.r-table__expand').trigger('click');
    expect(wrapper.emitted('update:expanded')?.at(-1)).toEqual([['a']]);

    await wrapper.setProps({ expanded: ['a'] });
    const detail = wrapper.find('.r-table__expansion .detail');
    expect(detail.text()).toBe('alpha');
    // Spans control + data columns so it clears the whole width.
    expect(wrapper.find('.r-table__expansion td').attributes('colspan')).toBe('2');
  });

  it('reflects open state on the toggle for assistive tech', async () => {
    const wrapper = mount(DataTable<Row>, { props: { ...BASE, expandable: true, expanded: ['b'] } });

    const toggles = wrapper.findAll('.r-table__expand').map((b) => b.attributes('aria-expanded'));
    expect(toggles).toEqual(['false', 'true', 'false']);
  });
});
