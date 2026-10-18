<script setup lang="ts">
import {
  Checkbox,
  Tree,
  ToggleGroup,
  type ToggleOption,
  type TreeItem,
  type TreeSelectable,
  type TreeSelectMode,
} from '@ets/ui';
import { computed, ref, watch } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { treeExample } from '../../apiExamples';
import { treeProps, treeItemProps } from '../../apiDocs';

const TREE: TreeItem[] = [
  {
    id: 'trading',
    label: 'Trading',
    icon: 'folder',
    children: [
      { id: 'pricing-api', label: 'pricing-api', icon: 'file-json' },
      { id: 'deals-sync', label: 'deals-sync', icon: 'file-json' },
      {
        id: 'robotrader',
        label: 'robotrader',
        icon: 'folder',
        children: [{ id: 'robotrader-base', label: '_base.json', icon: 'file-json' }],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: 'folder',
    children: [
      { id: 'billing-run', label: 'billing-run', icon: 'file-json' },
      { id: 'invoice-gen', label: 'invoice-gen', icon: 'file-json', disabled: true },
    ],
  },
];

const treeSelection = ref<string | string[] | undefined>('pricing-api');
const treeOpen = ref<string[]>(['trading']);
const treeOpenSelection = ref<string | string[] | undefined>();
const treeMulti = ref<string | string[] | undefined>(['deals-sync', 'billing-run']);
const treeChecked = ref<string | string[] | undefined>(['deals-sync', 'billing-run']);
const treeLeaves = ref<string | string[] | undefined>('pricing-api');

const playgroundMultiple = ref(true);
const playgroundCheckboxes = ref(true);
const playgroundSelectable = ref<TreeSelectable>('all');
const playgroundSelectMode = ref<TreeSelectMode>('toggle');
const playgroundSelection = ref<string | string[] | undefined>(['deals-sync', 'billing-run']);

const SELECTABLE_OPTIONS: ToggleOption<TreeSelectable>[] = [
  { value: 'all', label: 'all' },
  { value: 'leaf', label: 'leaf' },
];
const SELECT_MODE_OPTIONS: ToggleOption<TreeSelectMode>[] = [
  { value: 'toggle', label: 'toggle' },
  { value: 'select', label: 'select' },
];

/*
 * multiple changes the model shape (string vs string[]). Keep the selection
 * coherent when flipping the switch so the tree does not hold a stale shape.
 */
watch(playgroundMultiple, (multiple) => {
  const current = playgroundSelection.value;
  if (multiple) {
    playgroundSelection.value = current == null ? [] : Array.isArray(current) ? current : [current];
  } else {
    const first = Array.isArray(current) ? current[0] : current;
    playgroundSelection.value = first;
  }
});

const playgroundNote = computed(() => {
  const parts = [
    playgroundMultiple.value ? 'multiple' : 'single',
    `selectable="${playgroundSelectable.value}"`,
    `selectMode="${playgroundSelectMode.value}"`,
  ];
  if (playgroundCheckboxes.value) parts.push('checkboxes');
  const cascade = playgroundMultiple.value
    ? playgroundSelectable.value === 'leaf'
      ? 'selection cascades to leaves only'
      : 'selection cascades to all descendants'
    : 'selection is independent';
  return `Live options: ${parts.join(', ')}. ${cascade}.`;
});
</script>

<template>
  <Specimen title="Tree — playground" :note="playgroundNote">
    <div class="sb__stack">
      <div class="sb__opts">
        <Checkbox v-model="playgroundMultiple" label="multiple" />
        <Checkbox v-model="playgroundCheckboxes" label="checkboxes" />
        <ToggleGroup
          v-model="playgroundSelectable"
          :options="SELECTABLE_OPTIONS"
          label="selectable"
          mandatory
          size="sm"
        />
        <ToggleGroup
          v-model="playgroundSelectMode"
          :options="SELECT_MODE_OPTIONS"
          label="selectMode"
          mandatory
          size="sm"
          :disabled="playgroundCheckboxes"
        />
      </div>
      <Tree
        v-model="playgroundSelection"
        :items="TREE"
        label="Playground"
        :multiple="playgroundMultiple"
        :checkboxes="playgroundCheckboxes"
        :selectable="playgroundSelectable"
        :select-mode="playgroundSelectMode"
        open-all
      />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(playgroundSelection) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Tree — single selection"
    note="Expand/collapse is the chevron only — clicking a label selects without opening. Parents show a count of selected descendants on the right, and hover reveals expand-all / collapse-all for the subtree. openMode is the MODE ('single' | 'multiple'), not the set of open ids. A disabled node stays visible and unselectable. Default selectMode is select — click again keeps the node chosen."
  >
    <div class="sb__stack">
      <Tree v-model="treeSelection" :items="TREE" label="Configuration files" open-all />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(treeSelection) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Tree — leaves only"
    note='selectable="leaf" for file trees: parents expand, only nodes without children take a selection. Folders no longer need a disabled workaround that would also block expanding.'
  >
    <div class="sb__stack">
      <Tree v-model="treeLeaves" :items="TREE" label="Files" selectable="leaf" open-all />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(treeLeaves) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Tree — multiple, with a node slot"
    note="The node slot replaces a label, which is how a status chip or a row action gets in. Multi-select cascades: selecting a parent selects its descendants. Expansion stays internal here because no v-model:open is bound. Default selectMode is toggle."
  >
    <div class="sb__stack">
      <Tree v-model="treeMulti" :items="TREE" label="Files to publish" multiple open-all>
        <template #node="{ item }">
          <span class="sb__node">
            {{ item.label }}
            <em v-if="!item.children">leaf</em>
          </span>
        </template>
      </Tree>
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(treeMulti) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Tree — multiple with checkboxes"
    note="checkboxes draws a box between the chevron and the icon. Clicks always toggle (selectMode is ignored). In multiple mode, checking a parent selects every descendant; parents show a tristate (unchecked / mixed / checked). Icons stay; the box is decorative — aria-selected on the treeitem still owns the selection for assistive tech."
  >
    <div class="sb__stack">
      <Tree v-model="treeChecked" :items="TREE" label="Files to publish" multiple checkboxes open-all />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(treeChecked) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Tree — controlled expansion (v-model:open)"
    note="v-model:open binds the set of open branch ids — historically refused, until v0's nested context grew openedIds and a bridge could sync it both ways. Pair it with usePersistedTreeExpansion(key, { storagePrefix }) to remember expansion per operator; leave it unbound to keep expansion internal, exactly as before."
  >
    <div class="sb__stack">
      <Tree v-model="treeOpenSelection" v-model:open="treeOpen" :items="TREE" label="Configuration files" />
      <p class="sb__state">
        Open: <code>{{ JSON.stringify(treeOpen) }}</code>
      </p>
    </div>
  </Specimen>
  <CodeExample :code="treeExample" />

  <PropsTable :rows="treeProps" />
  <PropsTable :rows="treeItemProps" title="TreeItem" note="Node shape for `items`." />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
.sb__node em {
  margin-left: var(--sp-2);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-style: normal;
}
.sb__opts {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--sp-4);
}
</style>
