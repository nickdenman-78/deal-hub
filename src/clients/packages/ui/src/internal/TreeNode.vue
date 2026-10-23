<script setup lang="ts">
/**
 * One node, rendering itself for each child. Internal to Tree.
 *
 * Expand/collapse lives on the chevron alone (Treeview.Activator). The row
 * owns selection. Putting both on the same click target meant opening a folder
 * also selected it — and with selectable="leaf", a parent must stay expandable
 * without becoming a value.
 *
 * Parents also show a far-right count of selected descendants (any depth), and
 * on hover expose expand-all / collapse-all for the subtree — those walk v0's
 * nested registry rather than flipping the chevron one level at a time.
 */
import { Treeview, useTreeviewRoot } from '@vuetify/v0/components';
import { computed, inject } from 'vue';
import Icon from '../components/Icon.vue';
import {
  treeCheckboxesKey,
  treeMultipleKey,
  treeSelectableKey,
  treeSelectedIdsKey,
  treeSelectModeKey,
} from '../components/treeContext';
import type { TreeItem } from '../components/Tree.vue';

const props = defineProps<{ item: TreeItem }>();

defineSlots<{ node?: (props: { item: TreeItem }) => unknown }>();

const hasChildren = (item: TreeItem) => (item.children?.length ?? 0) > 0;

// Null-object defaults so a TreeNode rendered outside a Tree still behaves.
const selectMode = inject(treeSelectModeKey, () => 'select' as const);
const isMultiple = inject(treeMultipleKey, () => false);
const selectable = inject(treeSelectableKey, () => 'all' as const);
const showCheckboxes = inject(treeCheckboxesKey, () => false);
const selectedIds = inject(
  treeSelectedIdsKey,
  computed(() => new Set<string>() as ReadonlySet<string>),
);

const tree = useTreeviewRoot('v0:treeview');

function canSelect(item: TreeItem) {
  if (item.disabled) return false;
  /*
   * selectable="leaf" in single-select: parents are folders only. In multi-
   * select, v0 selection="leaf" lets a parent click select/clear its leaf
   * descendants (and drive the tristate checkbox), so parents stay clickable.
   */
  if (selectable() === 'leaf' && !isMultiple()) return !hasChildren(item);
  return true;
}

function onRowClick(selection: { select: () => void; toggle: () => void }) {
  if (!canSelect(props.item)) return;
  // Checkboxes are a toggle affordance — always clear on a second click,
  // even when selectMode is "select" for label-only trees.
  if (showCheckboxes() || selectMode() === 'toggle') selection.toggle();
  else selection.select();
}

/** Every descendant, any depth — used for counts and checkbox tristate. */
function eachDescendant(item: TreeItem, visit: (child: TreeItem) => void) {
  for (const child of item.children ?? []) {
    visit(child);
    if (child.children?.length) eachDescendant(child, visit);
  }
}

/** Selected nodes under this parent, any depth — the parent itself is excluded. */
const selectedDescendantCount = computed(() => {
  if (!hasChildren(props.item)) return 0;
  const selected = selectedIds.value;
  let count = 0;
  eachDescendant(props.item, (child) => {
    if (selected.has(child.id)) count += 1;
  });
  return count;
});

/*
 * Single-select never has a count above 1, so a numeral is noise — an asterisk
 * icon marks "the selection is under here". Multi-select keeps the number,
 * except when checkboxes are on: the tristate box already says none / some /
 * all, and a second badge next to it is noise.
 */
const selectedDescendantMark = computed(() => {
  if (selectedDescendantCount.value === 0) return null;
  if (showCheckboxes() && isMultiple()) return null;
  if (!isMultiple()) return 'asterisk' as const;
  return String(selectedDescendantCount.value);
});

const selectedDescendantLabel = computed(() => {
  if (selectedDescendantCount.value === 0) return undefined;
  if (!isMultiple()) return 'Selected below';
  return `${selectedDescendantCount.value} selected below`;
});

/*
 * Checkbox tristate is derived from selected ids rather than the renderless
 * slot's isMixed alone: v0 does not always mark mixed on the initial v-model
 * before a click, and leaf-mode parents are never themselves in the model.
 */
const checkVisual = computed(() => {
  if (!showCheckboxes()) return 'hidden' as const;
  if (props.item.disabled) return 'empty' as const;
  if (!canSelect(props.item) && !isMultiple()) return 'empty' as const;

  const selected = selectedIds.value;
  if (!hasChildren(props.item) || !isMultiple()) {
    return selected.has(props.item.id) ? ('on' as const) : ('off' as const);
  }

  const relevant: TreeItem[] = [];
  eachDescendant(props.item, (child) => {
    if (child.disabled) return;
    if (selectable() === 'leaf') {
      if (!child.children?.length) relevant.push(child);
    } else {
      relevant.push(child);
    }
  });

  const selectedCount = relevant.filter((child) => selected.has(child.id)).length;
  if (selectedCount === 0) {
    return selected.has(props.item.id) ? ('on' as const) : ('off' as const);
  }
  if (selectedCount === relevant.length) return 'on' as const;
  return 'mixed' as const;
});

function expandSubtree() {
  tree.expand(props.item.id);
}

function collapseSubtree() {
  const ids = [props.item.id, ...tree.getDescendants(props.item.id)];
  tree.close(ids);
}
</script>

<template>
  <Treeview.Item :id="item.id" class="r-tree__item" :value="item.id" :disabled="item.disabled">
    <!--
      SELECTION AND EXPANSION ARE TWO DIFFERENT v0 PRIMITIVES. Treeview.Activator
      only flips open/closed; Treeview.Checkbox owns select/toggle. They used to
      share one click target, so expanding a parent also selected it. The
      Activator is now the chevron only; the row calls select/toggle itself.
      Checkbox stays `renderless` so we do not stack a checkbox role on top of
      aria-selected on the treeitem.
    -->
    <Treeview.Checkbox v-slot="selection" renderless>
      <div class="r-tree__row" :class="{ 'r-tree__row--selectable': canSelect(item) }" @click="onRowClick(selection)">
        <!--
          Deliberately NOT Treeview.Indicator. That primitive is v0's SELECTION
          indicator — it carries data-state="checked|unchecked" and v0 sets
          `visibility: hidden` on it while unchecked, so a chevron placed inside
          it was invisible on every collapsed node and the tree offered no
          expand affordance at all. The chevron is ours; expansion is read from
          data-open, in Tree.vue.
        -->
        <!-- Always rendered, empty for a leaf, so labels line up across siblings
             regardless of which have children. stop on the Activator so a
             chevron click expands without also selecting the row. -->
        <Treeview.Activator v-if="hasChildren(item)" class="r-tree__chevron" @click.stop>
          <Icon name="chevron-right" :size="14" />
        </Treeview.Activator>
        <span v-else class="r-tree__chevron" />

        <!--
          Decorative only. Selection is already aria-selected on the treeitem;
          binding role="checkbox" here would stack a second control on the same
          node. Always reserve the slot when checkboxes are on so icons line up.
          Multi-select parents use the mixed (minus) state when some — but not
          all — descendants are selected.
        -->
        <span
          v-if="checkVisual !== 'hidden'"
          class="r-tree__check"
          :class="{
            'r-tree__check--on': checkVisual === 'on',
            'r-tree__check--mixed': checkVisual === 'mixed',
            'r-tree__check--empty': checkVisual === 'empty',
          }"
          aria-hidden="true"
        >
          <Icon v-if="checkVisual === 'on'" name="check" :size="12" />
          <Icon v-else-if="checkVisual === 'mixed'" name="minus" :size="12" />
        </span>

        <Icon v-if="item.icon" :name="item.icon" :size="14" />

        <span class="r-tree__label">
          <slot name="node" :item="item">{{ item.label }}</slot>
        </span>

        <span v-if="hasChildren(item)" class="r-tree__trailing" @click.stop>
          <span class="r-tree__actions">
            <button
              type="button"
              class="r-tree__action"
              title="Expand all"
              aria-label="Expand all"
              @click="expandSubtree"
            >
              <Icon name="list-tree" :size="14" />
            </button>
            <button
              type="button"
              class="r-tree__action"
              title="Collapse all"
              aria-label="Collapse all"
              @click="collapseSubtree"
            >
              <Icon name="list-collapse" :size="14" />
            </button>
          </span>
          <span
            v-if="selectedDescendantMark"
            class="r-tree__count"
            :class="{ 'r-tree__count--mark': selectedDescendantMark === 'asterisk' }"
            :aria-label="selectedDescendantLabel"
          >
            <Icon v-if="selectedDescendantMark === 'asterisk'" name="asterisk" :size="10" />
            <template v-else>{{ selectedDescendantMark }}</template>
          </span>
        </span>
      </div>
    </Treeview.Checkbox>

    <Treeview.Group v-if="hasChildren(item)" class="r-tree__group">
      <TreeNode v-for="child in item.children" :key="child.id" :item="child">
        <template #node="slotProps">
          <slot name="node" v-bind="slotProps" />
        </template>
      </TreeNode>
    </Treeview.Group>
  </Treeview.Item>
</template>
