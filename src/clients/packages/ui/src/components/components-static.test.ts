/*
 * The static display components — no v0 primitive underneath, so what a
 * refactor could silently change is the markup contract: which element carries
 * the accessible name, what hides from the tree, where slotted content lands.
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState.vue';
import PageHeader from './PageHeader.vue';
import Skeleton from './Skeleton.vue';

describe('Skeleton', () => {
  it('is hidden from the accessibility tree — the host announces loading', () => {
    const wrapper = mount(Skeleton);

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it('defaults to the line variant', () => {
    const wrapper = mount(Skeleton);

    expect(wrapper.classes()).toContain('r-skeleton--line');
  });

  it('lets an explicit width override the variant default', () => {
    const wrapper = mount(Skeleton, { props: { variant: 'title', width: '7rem' } });

    expect((wrapper.element as HTMLElement).style.width).toBe('7rem');
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No services yet', description: 'Register one to get started.' },
    });

    expect(wrapper.find('.r-empty-state__title').text()).toBe('No services yet');
    expect(wrapper.find('.r-empty-state__description').text()).toBe('Register one to get started.');
  });

  it('renders the actions row only when the slot is filled', () => {
    const bare = mount(EmptyState, { props: { title: 'Empty' } });
    const withAction = mount(EmptyState, {
      props: { title: 'Empty' },
      slots: { actions: '<button>Add</button>' },
    });

    expect(bare.find('.r-empty-state__actions').exists()).toBe(false);
    expect(withAction.find('.r-empty-state__actions button').text()).toBe('Add');
  });
});

describe('PageHeader', () => {
  it('renders the title in an h1 by default', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Services' } });

    expect(wrapper.find('h1').text()).toBe('Services');
  });

  it('demotes the heading level via `as` so nested surfaces keep an honest outline', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Files', as: 'h2' } });

    expect(wrapper.find('h1').exists()).toBe(false);
    expect(wrapper.find('h2').text()).toBe('Files');
  });

  it('shows the subtitle only when given, monospace only when asked', () => {
    const bare = mount(PageHeader, { props: { title: 'T' } });
    const sub = mount(PageHeader, { props: { title: 'T', subtitle: 'billing-api', subtitleMono: true } });

    expect(bare.find('.r-page-header__subtitle').exists()).toBe(false);
    expect(sub.find('.r-page-header__subtitle').text()).toBe('billing-api');
    expect(sub.find('.r-page-header__subtitle--mono').exists()).toBe(true);
  });

  it('places meta beside the title and actions at the trailing edge', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'T' },
      slots: { meta: '<span class="tag">prod</span>', actions: '<button>Edit</button>' },
    });

    const row = wrapper.find('.r-page-header__row');
    expect(row.find('.tag').exists()).toBe(true);
    expect(wrapper.find('.r-page-header__actions button').text()).toBe('Edit');
  });
});
