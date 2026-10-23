/*
 * Tree's `v-model:open` — the contract usePersistedTreeExpansion binds to.
 * Every assertion is something a v0 minor could silently change: whether the
 * nested registry accepts external open/close, whether data-open reaches the
 * treeitem, whether unregistered ids are skipped.
 */
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import Tree from './Tree.vue';
import type { TreeItem } from './Tree.vue';

const ITEMS: TreeItem[] = [
  {
    id: 'groups',
    label: 'Groups',
    children: [
      { id: 'groups/billing', label: 'billing', children: [{ id: 'groups/billing/api', label: 'api' }] },
      { id: 'groups/retail', label: 'retail' },
    ],
  },
  { id: 'services', label: 'Services', children: [{ id: 'services/mailer', label: 'mailer' }] },
];

/*
 * The treeitem's `id` prop feeds v0's registry but is NOT rendered as a DOM
 * attribute, so open state is probed by each open item's own row label
 * (`:scope >` keeps a parent from claiming its children's labels).
 */
function openLabels(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper
    .findAll('.r-tree__item[data-open="true"]')
    .map((n) => n.element.querySelector(':scope > .r-tree__row .r-tree__label')?.textContent?.trim() ?? '')
    .filter(Boolean);
}

describe('Tree v-model:open', () => {
  it('opens the branches named by the initial model', async () => {
    const wrapper = mount(Tree, {
      props: { items: ITEMS, label: 'Files', open: ['groups', 'groups/billing'] },
    });
    // The bridge applies after the nodes' first render; data-open lands on the
    // re-render that flushes on the next tick.
    await nextTick();

    expect(openLabels(wrapper)).toEqual(expect.arrayContaining(['Groups', 'billing']));
    expect(openLabels(wrapper)).not.toContain('Services');
  });

  it('reports a chevron toggle through the model', async () => {
    const wrapper = mount(Tree, { props: { items: ITEMS, label: 'Files', open: [] } });

    await wrapper.find('.r-tree__chevron').trigger('click');
    const updates = wrapper.emitted('update:open');
    expect(updates?.at(-1)).toEqual([['groups']]);
  });

  it('applies a model write: added ids open, removed ids close', async () => {
    const wrapper = mount(Tree, { props: { items: ITEMS, label: 'Files', open: ['groups'] } });

    await wrapper.setProps({ open: ['services'] });
    await nextTick();

    expect(openLabels(wrapper)).toContain('Services');
    expect(openLabels(wrapper)).not.toContain('Groups');
  });

  it('drops ids that name no node instead of erroring', async () => {
    const wrapper = mount(Tree, {
      props: { items: ITEMS, label: 'Files', open: ['groups', 'no-such-node'] },
    });
    await nextTick();

    expect(openLabels(wrapper)).toContain('Groups');
    // The phantom id must not be echoed back as if it were open.
    const updates = wrapper.emitted('update:open') as string[][][] | undefined;
    for (const [ids] of updates ?? []) {
      expect(ids).not.toContain('no-such-node');
    }
  });

  it('leaves expansion fully internal when the model is unbound', async () => {
    const wrapper = mount(Tree, { props: { items: ITEMS, label: 'Files' } });

    await wrapper.find('.r-tree__chevron').trigger('click');
    expect(openLabels(wrapper)).toContain('Groups');
  });
});
