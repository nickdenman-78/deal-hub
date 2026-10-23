<script setup lang="ts">
/**
 * Hierarchical tree on v0's Treeview, which owns the expand/collapse state,
 * multi-select with parent/child propagation, and the roving-focus keyboard
 * traversal a tree role requires.
 *
 * Recursive rendering lives in TreeNode: a tree of unknown depth cannot be a
 * flat v-for, and inlining the recursion here would mean a component that
 * renders itself, which Vue allows but which makes the slot plumbing
 * considerably harder to follow.
 */
import { Treeview } from '@vuetify/v0/components';
import { computed, provide, useAttrs } from 'vue';
import TreeNode from '../internal/TreeNode.vue';
import TreeOpenBridge from '../internal/treeOpenBridge';
import {
  treeCheckboxesKey,
  treeMultipleKey,
  treeSelectableKey,
  treeSelectedIdsKey,
  treeSelectModeKey,
  type TreeSelectable,
  type TreeSelectMode,
} from './treeContext';

export type { TreeSelectable, TreeSelectMode };
export interface TreeItem {
  /** Stable identity. Selection and open state key off it. */
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  children?: TreeItem[];
}

/*
 * Treeview.Root is a fragment (List + open-state bridge), so caller class would
 * warn and drop. Forward attrs onto the list — the visible tree root.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    items: readonly TreeItem[];
    /** Names the tree for assistive tech. */
    label: string;
    /** Allows selecting more than one node. */
    multiple?: boolean;
    /**
     * Which nodes accept selection. `'all'` (default) lets any non-disabled
     * node be chosen; `'leaf'` restricts the *value* to nodes without children.
     * In multiple mode that still lets a parent click select/clear its leaf
     * descendants (and drive a tristate checkbox); in single mode a parent
     * click is ignored so expand/collapse stays on the chevron.
     */
    selectable?: TreeSelectable;
    /**
     * How a row click treats an already-selected node. `'toggle'` clears it;
     * `'select'` leaves it selected. When omitted, follows `multiple`
     * (toggle when multi, select when single) — a single-select toggle that
     * empties the tree reads as the click having failed. Ignored when
     * `checkboxes` is on: a checkbox is always a toggle.
     */
    selectMode?: TreeSelectMode;
    /**
     * Draw a checkbox beside each node's icon. In `multiple` mode parents are
     * tristate (none / some / all descendants selected). The icon stays; the
     * box sits between chevron and icon.
     */
    checkboxes?: boolean;
    /**
     * How many branches may be open at once. v0's `open` prop is this MODE
     * (`'single' | 'multiple'`), not the set of open ids — an easy misread,
     * since every neighbouring prop is state.
     */
    openMode?: 'single' | 'multiple';
    /** Expand everything on first render. */
    openAll?: boolean;
  }>(),
  { openMode: 'multiple', selectable: 'all' },
);

/**
 * Selected node ids.
 */
const model = defineModel<string | string[] | undefined>();

/**
 * Open branch ids.
 *
 * Historically refused ("v0 exposes no way to read or write the open SET") —
 * that stopped being true: the nested context now carries `openedIds` plus
 * open/close/flip, and TreeOpenBridge syncs it both ways from inside the Root.
 * Pair with `usePersistedTreeExpansion` to remember expansion per operator.
 * Leave unbound to keep expansion internal, exactly as before.
 */
const openModel = defineModel<string[]>('open');

const selectedIds = computed<ReadonlySet<string>>(() => {
  const value = model.value;
  if (value == null) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
});

/*
 * Multi-select uses v0 cascade (or leaf when selectable="leaf"): checking a
 * parent selects its descendants and parents report tri-state via isMixed.
 * Single-select stays independent — cascade would force ancestors into the
 * model and fight a one-id value.
 */
const nestedSelection = computed(() => {
  if (!props.multiple) return 'independent' as const;
  if (props.selectable === 'leaf') return 'leaf' as const;
  return 'cascade' as const;
});

/*
 * How a node reacts to being clicked, provided rather than passed because
 * TreeNode is recursive. Default follows `multiple` when selectMode is omitted.
 */
provide(treeSelectModeKey, () => props.selectMode ?? (props.multiple ? 'toggle' : 'select'));
provide(treeMultipleKey, () => props.multiple === true);
provide(treeSelectableKey, () => props.selectable);
provide(treeSelectedIdsKey, selectedIds);
provide(treeCheckboxesKey, () => props.checkboxes === true);

defineSlots<{
  /** Replaces a node's label, e.g. to add a status chip or an action. */
  node?: (props: { item: TreeItem }) => unknown;
}>();
</script>

<template>
  <Treeview.Root v-model="model" :multiple="multiple" :open="openMode" :open-all="openAll" :selection="nestedSelection">
    <Treeview.List class="r-tree" v-bind="attrs" :label="label" :multiselectable="multiple">
      <TreeNode v-for="item in items" :key="item.id" :item="item">
        <template #node="slotProps">
          <slot name="node" v-bind="slotProps" />
        </template>
      </TreeNode>
    </Treeview.List>
    <!-- AFTER the list: the bridge's immediate apply must find the initial
         nodes already registered. See treeOpenBridge.ts. -->
    <TreeOpenBridge :open="openModel" :items="items" @update:open="openModel = $event" />
  </Treeview.Root>
</template>

<style>
.r-tree {
  margin: 0;
  padding: 0;
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  list-style: none;
}

.r-tree__group {
  margin: 0;
  /* The indent guide runs down the group, so the hierarchy is readable
       without counting indents. */
  padding: 0 0 0 var(--sp-4);
  border-left: 1px solid var(--border-subtle);
  margin-left: var(--sp-3);
  list-style: none;
}

.r-tree__item {
  list-style: none;
}

.r-tree__row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-1) var(--sp-2);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-primary);
  font: inherit;
  text-align: start;
  cursor: default;
}

.r-tree__row--selectable {
  cursor: pointer;
}

.r-tree__row:hover {
  background: var(--bg-surface-3);
}

/*
 * The state attributes live on the TREEITEM, not on the row.
 *
 * Treeview.Item renders the element carrying role="treeitem", aria-selected and
 * aria-disabled; Treeview.Activator renders the row inside it. Styling
 * `.r-tree__row[aria-selected='true']` therefore matched nothing, and the tree
 * showed no selection at all — silently, because a selector that matches
 * nothing is not an error.
 */
.r-tree__item[aria-selected='true'] > .r-tree__row {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-tree__item[aria-disabled='true'] > .r-tree__row {
  opacity: 0.5;
  cursor: not-allowed;
}

/* A fixed-width slot for the chevron so labels line up whether or not a node
     has children — otherwise leaves sit a chevron-width to the left of folders.
     The Activator is a button; strip chrome so it reads as the icon alone. */
.r-tree__chevron {
  display: inline-flex;
  width: 14px;
  flex: none;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--fg-faint);
  cursor: pointer;
}

/*
 * Same box language as Checkbox, sized for the tree row. Filled state is class-
 * driven from the renderless Treeview.Checkbox slot (isSelected / isMixed), not
 * from a nested checkbox role — see TreeNode.
 */
.r-tree__check {
  display: grid;
  width: 14px;
  height: 14px;
  flex: none;
  border: 1px solid var(--border-input);
  border-radius: var(--r-xs);
  background: var(--bg-surface);
  color: var(--fg-on-accent);
  place-items: center;
}

.r-tree__check--on,
.r-tree__check--mixed {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
}

.r-tree__check--empty {
  border-color: transparent;
  background: transparent;
}

.r-tree__check .r-icon {
  vertical-align: 0;
}

/*
 * v0 exposes expansion as data-open on the treeitem. It emits no aria-expanded
 * at all, so the obvious selector matched nothing and the chevron never turned.
 */
.r-tree__chevron .r-icon {
  transition: transform var(--dur-fast) var(--ease-out);
}

/*
 * COLLAPSE IS OURS TO DRAW. Treeview.Group renders role="group" and nothing
 * else — it carries no open/closed attribute and does not hide itself, so
 * collapsing a branch cleared data-open, turned the chevron back, and left
 * every child sitting on screen. display:none rather than visibility or a
 * height, so the collapsed rows leave the accessibility tree and the tab order
 * with them.
 */
.r-tree__item:not([data-open='true']) > .r-tree__group {
  display: none;
}

.r-tree__item[data-open='true'] > .r-tree__row .r-tree__chevron .r-icon {
  transform: rotate(90deg);
}

.r-tree__label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Pushed to the far right: hover expand/collapse for the subtree, then the
     selected-descendant count (only when > 0). */
.r-tree__trailing {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--sp-1);
  margin-left: auto;
}

.r-tree__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease-out);
}

.r-tree__row:hover .r-tree__actions,
.r-tree__row:focus-within .r-tree__actions {
  opacity: 1;
  pointer-events: auto;
}

.r-tree__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-tree__action:hover {
  background: var(--bg-surface-2);
  color: var(--fg-primary);
}

.r-tree__count {
  display: inline-flex;
  min-width: 1.125rem;
  height: 1.125rem;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-size: 0.625rem;
  font-weight: var(--fw-semibold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* Icon mark: square pill, no horizontal padding that would shift the glyph. */
.r-tree__count--mark {
  width: 1.125rem;
  padding: 0;
}

.r-tree__count--mark .r-icon {
  /* Undo Icon's baseline offset so the glyph sits in the geometric centre. */
  vertical-align: 0;
}
</style>
