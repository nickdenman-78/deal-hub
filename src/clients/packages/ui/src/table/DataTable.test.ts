import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick, type Component } from 'vue';
import { registerEtsIcons } from '../icons';
import DataTable from './DataTable.vue';
import type { DataTableColumn } from './types';

interface Service extends Record<string, unknown> {
  name: string;
  bucket: string;
  owner: string;
  keys: number;
}

const SERVICES: Service[] = [
  { name: 'pricing-api', bucket: 'Trading', owner: 'desk', keys: 12 },
  { name: 'deals-sync', bucket: 'Trading', owner: 'ops', keys: 3 },
  { name: 'billing-run', bucket: 'Billing', owner: 'finance', keys: 47 },
  { name: 'invoice-gen', bucket: 'Billing', owner: 'finance', keys: 8 },
];

const COLUMNS: DataTableColumn<Service>[] = [
  { id: 'name', header: 'Name', field: 'name', sortable: true, filterable: true },
  { id: 'owner', header: 'Owner', field: 'owner', filterable: true },
  { id: 'keys', header: 'Keys', field: 'keys', sortable: true, align: 'end' },
  { id: 'actions', header: '' },
];

beforeAll(() => registerEtsIcons());

/*
 * Widened to `Component` for the harness only. vue-tsc cannot infer a
 * `generic="T"` SFC's prop types through mount(), so the alternative is an
 * `as never` on the component — which then makes the whole options object
 * unassignable. This keeps the assertions typed and loses inference only on
 * the props literal.
 */
const Table = DataTable as unknown as Component;

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Table, {
    props: {
      rows: SERVICES,
      columns: COLUMNS,
      rowId: (row: Service) => row.name,
      ...props,
    },
    slots,
  });
}

const rowText = (wrapper: ReturnType<typeof mountTable>) =>
  wrapper.findAll('tr[data-row]').map((r) => r.findAll('td')[0].text());

describe('rendering', () => {
  it('renders a row per item and a cell per column', () => {
    const wrapper = mountTable();
    expect(wrapper.findAll('tr[data-row]')).toHaveLength(4);
    expect(wrapper.findAll('tr[data-row]')[0].findAll('td')).toHaveLength(4);
  });

  it('renders the empty slot instead of a table when there are no rows', () => {
    const wrapper = mountTable({ rows: [] }, { empty: 'No services yet.' });
    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.text()).toContain('No services yet.');
  });

  it('shows a spinner instead of rows while loading', () => {
    const wrapper = mountTable({ loading: true });
    expect(wrapper.find('table').exists()).toBe(false);
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it('uses a cell slot when one is given', () => {
    const wrapper = mountTable({}, { 'cell-name': '<b>{{ params.row.name }}</b>' });
    expect(wrapper.find('tr[data-row] b').text()).toBe('pricing-api');
  });

  it('renders every row the caller passed — v0 must not silently page to 10', () => {
    // Regression: createDataTable defaults itemsPerPage to 10. Pagination lives
    // outside the table; truncating here made external page-size look broken.
    const rows = Array.from({ length: 25 }, (_, i) => ({
      name: `svc-${i}`,
      bucket: 'Trading',
      owner: 'desk',
      keys: i,
    }));
    const wrapper = mountTable({ rows });
    expect(wrapper.findAll('tr[data-row]')).toHaveLength(25);
  });
});

describe('sorting', () => {
  /*
   * v0 cycles none -> asc -> desc -> none. Worth pinning: `sort` is
   * preview-level API, and a change to the cycle would silently reverse
   * every table in the product rather than erroring.
   */
  it('cycles a sortable column through asc, desc and back to none', async () => {
    const wrapper = mountTable();
    const sortButton = wrapper.findAll('th')[0].find('button');

    expect(wrapper.findAll('th')[0].attributes('aria-sort')).toBe('none');

    await sortButton.trigger('click');
    expect(wrapper.findAll('th')[0].attributes('aria-sort')).toBe('ascending');
    expect(rowText(wrapper)).toEqual(['billing-run', 'deals-sync', 'invoice-gen', 'pricing-api']);

    await sortButton.trigger('click');
    expect(wrapper.findAll('th')[0].attributes('aria-sort')).toBe('descending');
    expect(rowText(wrapper)).toEqual(['pricing-api', 'invoice-gen', 'deals-sync', 'billing-run']);

    await sortButton.trigger('click');
    expect(wrapper.findAll('th')[0].attributes('aria-sort')).toBe('none');
  });

  it('offers no sort control on a column with no field to compare', () => {
    const wrapper = mountTable();
    // 'actions' is declared without a field, so it cannot honestly sort.
    expect(wrapper.findAll('th')[3].find('button').exists()).toBe(false);
    expect(wrapper.findAll('th')[3].attributes('aria-sort')).toBeUndefined();
  });
});

describe('search', () => {
  it('filters across filterable columns only', async () => {
    const wrapper = mountTable({ search: 'finance' });
    await nextTick();
    // 'owner' is filterable; both finance-owned services survive.
    expect(rowText(wrapper)).toEqual(['billing-run', 'invoice-gen']);
  });

  it('ignores columns that are not filterable', async () => {
    // 'keys' is sortable but not filterable, so a numeric query matches nothing.
    const wrapper = mountTable({ search: '47' });
    await nextTick();
    expect(wrapper.find('table').exists()).toBe(false);
  });
});

describe('grouping', () => {
  it('renders a subheader per group with its count', () => {
    const wrapper = mountTable({ groupBy: 'bucket', openGroupsInitially: true });
    const headers = wrapper.findAll('.r-table__group-header');
    expect(headers).toHaveLength(2);
    expect(headers.map((h) => h.text())).toEqual(expect.arrayContaining([expect.stringContaining('Trading')]));
  });

  it('collapses a group by not emitting its rows', async () => {
    const wrapper = mountTable({ groupBy: 'bucket', openGroupsInitially: true });
    expect(wrapper.findAll('tr[data-row]')).toHaveLength(4);

    await wrapper.findAll('.r-table__group-toggle')[0].trigger('click');
    expect(wrapper.findAll('tr[data-row]')).toHaveLength(2);
    expect(wrapper.findAll('.r-table__group-toggle')[0].attributes('aria-expanded')).toBe('false');
  });

  it('exposes open groups as a model, so an app can persist them', async () => {
    const wrapper = mountTable({ groupBy: 'bucket', openGroups: ['Billing'] });
    await nextTick();

    expect(wrapper.findAll('tr[data-row]')).toHaveLength(2);
    expect(rowText(wrapper)).toEqual(['billing-run', 'invoice-gen']);
  });

  it('emits the open-group set when a group is toggled', async () => {
    const wrapper = mountTable({ groupBy: 'bucket', openGroups: [] });
    await nextTick();

    await wrapper.findAll('.r-table__group-toggle')[0].trigger('click');
    await nextTick();

    const emitted = wrapper.emitted('update:openGroups');
    expect(emitted).toBeTruthy();
    expect(emitted?.at(-1)?.[0]).toEqual(['Trading']);
  });
});

describe('filters', () => {
  it('renders no filter bar without the filters slot', () => {
    const wrapper = mountTable();
    expect(wrapper.find('.r-table__filters').exists()).toBe(false);
    expect(wrapper.find('table').classes()).not.toContain('r-table--has-filters');
  });

  it('renders a sticky filter bar above headers when #filters is given', () => {
    const wrapper = mountTable({}, { filters: '<input aria-label="Filter" />' });

    const theadRows = wrapper.findAll('thead tr');
    expect(theadRows).toHaveLength(2);
    expect(theadRows[0].classes()).toContain('r-table__filters');
    expect(wrapper.find('table').classes()).toContain('r-table--has-filters');
    expect(theadRows[0].find('th').attributes('colspan')).toBe('4');
    expect(theadRows[0].find('input[aria-label="Filter"]').exists()).toBe(true);
    expect(theadRows[1].text()).toContain('Name');
  });

  it('keeps the filter bar mounted when the filtered set is empty', () => {
    const wrapper = mountTable({ rows: [], emptyText: 'No matches.' }, { filters: '<input aria-label="Filter" />' });

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('.r-table__filters').exists()).toBe(true);
    expect(wrapper.find('.r-table__state-row').text()).toContain('No matches.');
  });

  it('keeps the filter bar mounted while loading', () => {
    const wrapper = mountTable({ loading: true }, { filters: '<input aria-label="Filter" />' });

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('.r-table__filters').exists()).toBe(true);
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
  });

  it('omits field labels by default and shows them when showFilterLabels is set', () => {
    const wrapper = mountTable(
      {},
      { filters: '<span class="r-field"><label class="r-field__label">Name</label></span>' },
    );
    expect(wrapper.find('.r-table__filters').classes()).not.toContain('r-table__filters--show-labels');

    return wrapper.setProps({ showFilterLabels: true }).then(() => {
      expect(wrapper.find('.r-table__filters').classes()).toContain('r-table__filters--show-labels');
    });
  });
});

describe('row activation', () => {
  it('stays inert without rowHref', async () => {
    const wrapper = mountTable();
    await wrapper.find('tr[data-row]').trigger('click');
    expect(wrapper.emitted('rowActivate')).toBeUndefined();
    expect(wrapper.find('tr[data-row]').attributes('tabindex')).toBeUndefined();
  });

  it('emits rowActivate rather than navigating itself', async () => {
    const wrapper = mountTable({ rowHref: (row: Service) => `/services/${row.name}` });
    await wrapper.find('tr[data-row]').trigger('click');

    const emitted = wrapper.emitted('rowActivate');
    expect(emitted).toHaveLength(1);
    expect((emitted?.[0][0] as Service).name).toBe('pricing-api');
  });

  it('opens a new tab on ctrl-click instead of emitting', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountTable({ rowHref: (row: Service) => `/services/${row.name}` });

    await wrapper.find('tr[data-row]').trigger('click', { ctrlKey: true });

    expect(open).toHaveBeenCalledWith('/services/pricing-api', '_blank', 'noopener');
    expect(wrapper.emitted('rowActivate')).toBeUndefined();
    open.mockRestore();
  });

  it('lets a control inside the row win the click', async () => {
    const wrapper = mountTable(
      { rowHref: (row: Service) => `/services/${row.name}` },
      { 'cell-actions': '<button class="inline-action">Edit</button>' },
    );

    await wrapper.find('.inline-action').trigger('click');
    expect(wrapper.emitted('rowActivate')).toBeUndefined();
  });

  it('activates on Enter and Space', async () => {
    const wrapper = mountTable({ rowHref: (row: Service) => `/services/${row.name}` });
    await wrapper.find('tr[data-row]').trigger('keydown', { key: 'Enter' });
    await wrapper.find('tr[data-row]').trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('rowActivate')).toHaveLength(2);
  });
});

describe('roving tabindex', () => {
  it('gives the table exactly one tab stop', () => {
    const wrapper = mountTable({ rowHref: (row: Service) => `/services/${row.name}` });
    const tabindexes = wrapper.findAll('tr[data-row]').map((r) => r.attributes('tabindex'));
    expect(tabindexes.filter((t) => t === '0')).toHaveLength(1);
    expect(tabindexes[0]).toBe('0');
  });

  it('moves the tab stop to the open record, so tabbing back returns you there', () => {
    const wrapper = mountTable({
      rowHref: (row: Service) => `/services/${row.name}`,
      rowActive: (row: Service) => row.name === 'billing-run',
    });
    const tabindexes = wrapper.findAll('tr[data-row]').map((r) => r.attributes('tabindex'));
    expect(tabindexes).toEqual(['-1', '-1', '0', '-1']);
    expect(wrapper.findAll('tr[data-row]')[2].classes()).toContain('is-active');
  });
});
