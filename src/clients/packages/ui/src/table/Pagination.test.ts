import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Pagination from './Pagination.vue';
import { DEFAULT_PAGE_SIZE_OPTIONS, parsePageSize } from './pageSize';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('parsePageSize', () => {
  it('accepts positive integers', () => {
    expect(parsePageSize(10)).toBe(10);
    expect(parsePageSize('25')).toBe(25);
    expect(parsePageSize(' 40 ')).toBe(40);
  });

  it('rejects non-integers and values below 1', () => {
    expect(parsePageSize(0)).toBeNull();
    expect(parsePageSize(-5)).toBeNull();
    expect(parsePageSize(1.5)).toBeNull();
    expect(parsePageSize('')).toBeNull();
    expect(parsePageSize('abc')).toBeNull();
    expect(parsePageSize(undefined)).toBeNull();
  });
});

describe('Pagination page size', () => {
  it('defaults to the standard page-size catalog', () => {
    expect(DEFAULT_PAGE_SIZE_OPTIONS).toEqual([10, 15, 20, 25, 30, 40, 50, 100]);
  });

  it('shows a custom field when the current size is not a preset', async () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 1,
        pageSize: 37,
        total: 200,
        'onUpdate:page': (v: number) => wrapper.setProps({ page: v }),
        'onUpdate:pageSize': (v: number) => wrapper.setProps({ pageSize: v }),
      },
      attachTo: document.body,
    });

    const input = wrapper.find('.r-pagination__custom input');
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('37');

    await input.setValue('42');
    await input.trigger('keydown.enter');
    await nextTick();

    expect(wrapper.emitted('update:pageSize')?.at(-1)).toEqual([42]);
    expect(wrapper.emitted('update:page')?.at(-1)).toEqual([0]);
    wrapper.unmount();
  });

  it('hides the custom field when allowCustomPageSize is false', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 0,
        pageSize: 25,
        total: 50,
        allowCustomPageSize: false,
        pageSizeOptions: [10, 25, 50],
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.r-pagination__custom').exists()).toBe(false);
    expect(wrapper.find('.r-select__trigger').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows only the custom field when presets are empty but custom is allowed', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 0,
        pageSize: 12,
        total: 50,
        pageSizeOptions: [],
        allowCustomPageSize: true,
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.r-select__trigger').exists()).toBe(false);
    expect(wrapper.find('.r-pagination__custom input').exists()).toBe(true);
    wrapper.unmount();
  });

  it('hides the Rows control when presets are empty and custom is disallowed', () => {
    const wrapper = mount(Pagination, {
      props: {
        page: 0,
        pageSize: 25,
        total: 50,
        pageSizeOptions: [],
        allowCustomPageSize: false,
      },
      attachTo: document.body,
    });

    expect(wrapper.find('.r-pagination__size').exists()).toBe(false);
    wrapper.unmount();
  });
});
