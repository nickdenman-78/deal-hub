import type { ComputedRef, InjectionKey } from 'vue';

/**
 * How a node should treat a click on itself.
 *
 * Its own module rather than a symbol exported from Tree.vue: TreeNode already
 * imports the TreeItem *type* from Tree.vue, which erases at build time, but a
 * runtime import would close a real cycle (Tree renders TreeNode renders
 * TreeNode…).
 *
 * `select` is idempotent and `toggle` is not. Default follows `multiple`
 * (toggle when multi, select when single) so a second click on a single-select
 * node does not clear the selection and leave the tree looking empty.
 */
export type TreeSelectMode = 'select' | 'toggle';

export const treeSelectModeKey = Symbol('ets.tree.selectMode') as InjectionKey<() => TreeSelectMode>;

/**
 * Which nodes accept selection. Expand/collapse is always the chevron alone;
 * this only gates whether a row click calls select/toggle.
 *
 * `leaf` is for file trees and the like, where a parent is a folder to open,
 * not a value to pick — without it the only alternative is `disabled`, which
 * also blocks expanding.
 */
export type TreeSelectable = 'all' | 'leaf';

export const treeSelectableKey = Symbol('ets.tree.selectable') as InjectionKey<() => TreeSelectable>;

/**
 * Whether more than one node may be selected. Drives the selected-descendant
 * badge (numeral vs asterisk), independent of click selectMode.
 */
export const treeMultipleKey = Symbol('ets.tree.multiple') as InjectionKey<() => boolean>;

/** Selected ids for descendant-count badges on parents. */
export const treeSelectedIdsKey = Symbol('ets.tree.selectedIds') as InjectionKey<ComputedRef<ReadonlySet<string>>>;

/**
 * Whether selectable rows draw a checkbox beside the icon.
 *
 * Visual only — selection still rides `aria-selected` on the treeitem. A real
 * checkbox role here would stack on top of that and fight the tree pattern.
 */
export const treeCheckboxesKey = Symbol('ets.tree.checkboxes') as InjectionKey<() => boolean>;
