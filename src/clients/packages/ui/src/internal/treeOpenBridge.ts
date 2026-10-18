import { useTreeviewRoot } from '@vuetify/v0/components';
import { defineComponent, watch, type PropType } from 'vue';
import type { TreeItem } from '../components/Tree.vue';

/*
 * The two-way half of Tree's `v-model:open`. Internal to Tree.
 *
 * v0's nested context now exposes the open SET (`openedIds` plus
 * open/close/flip) — the capability whose absence was why Tree historically
 * refused an open model. But the context is provided by Treeview.Root to its
 * DESCENDANTS, so Tree.vue's own setup cannot inject it; this renderless
 * child, mounted inside the Root, is where the sync lives.
 *
 * Two load-bearing details, both consequences of `open()` silently skipping
 * ids that have not registered yet (`group.get(id)` misses → continue):
 *
 * 1. Tree renders this bridge AFTER the node list, so every initially-present
 *    Treeview.Item has registered (registration happens in its setup, and
 *    setups run in template order) before the immediate model apply.
 * 2. The bridge also re-applies the model whenever `items` changes, with
 *    `flush: 'post'`, so ids that arrive with async data are opened once
 *    their nodes exist. Without this, restoring persisted expansion into a
 *    tree whose data loads after mount is a silent no-op.
 *
 * Echo control is set-comparison, not flags: registry → model emits only when
 * the sets differ, and model → registry diffs before calling open/close, so a
 * reflected update finds nothing to do and the loop terminates.
 */
export default defineComponent({
  name: 'TreeOpenBridge',
  props: {
    open: { type: Array as PropType<readonly string[]>, default: undefined },
    items: { type: Array as PropType<readonly TreeItem[]>, required: true },
  },
  emits: ['update:open'],
  setup(props, { emit }) {
    const tree = useTreeviewRoot('v0:treeview');

    function apply(want: readonly string[] | undefined) {
      if (!want) return; // unbound model must not close everything
      const wanted = new Set(want);
      const toClose = [...tree.openedIds].filter((id) => !wanted.has(String(id)));
      const toOpen = want.filter((id) => !tree.opened(id));
      if (toClose.length > 0) tree.close(toClose);
      if (toOpen.length > 0) tree.open(toOpen);
    }

    watch(() => props.open, apply, { immediate: true, deep: true });

    // Late registrations (async data): re-apply once the new nodes exist.
    watch(
      () => props.items,
      () => apply(props.open),
      { flush: 'post', deep: true },
    );

    watch(
      // Array.from iterates the reactive Set, so mutations re-trigger.
      () => Array.from(tree.openedIds, String),
      (ids) => {
        const current = props.open;
        if (current && current.length === ids.length && ids.every((id) => current.includes(id))) return;
        emit('update:open', ids);
      },
    );

    return () => null;
  },
});
