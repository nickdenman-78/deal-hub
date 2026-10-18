<script setup lang="ts">
import { Button, EditorTabs, type EditorTab } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { editorTabsExample } from '../../apiExamples';
import { editorTabsProps, editorTabProps } from '../../apiDocs';

const DOCUMENTS: EditorTab[] = [
  { id: 'base', label: '_base.json', title: 'trading/pricing-api/_base.json' },
  { id: 'test', label: 'test.json', title: 'trading/pricing-api/test.json', dirty: true },
  { id: 'prod', label: 'prod.json', title: 'trading/pricing-api/prod.json' },
  { id: 'notes', label: 'NOTES.md', icon: 'book' },
];

const tabs = ref<EditorTab[]>([...DOCUMENTS]);
const active = ref<string | undefined>('test');

function close(id: string) {
  const idx = tabs.value.findIndex((t) => t.id === id);
  tabs.value = tabs.value.filter((t) => t.id !== id);
  if (active.value === id) active.value = (tabs.value[idx] ?? tabs.value[idx - 1])?.id;
}

function closeOthers(id: string) {
  tabs.value = tabs.value.filter((t) => t.id === id);
  active.value = id;
}

function closeRight(id: string) {
  const idx = tabs.value.findIndex((t) => t.id === id);
  tabs.value = tabs.value.slice(0, idx + 1);
  if (active.value !== undefined && !tabs.value.some((t) => t.id === active.value)) active.value = id;
}

function closeAll() {
  tabs.value = [];
  active.value = undefined;
}

function reorder(orderedIds: string[]) {
  tabs.value = orderedIds
    .map((id) => tabs.value.find((t) => t.id === id))
    .filter((t): t is EditorTab => t !== undefined);
}

function reset() {
  tabs.value = [...DOCUMENTS];
  active.value = 'test';
}

const FIXED: EditorTab[] = [
  { id: 'request', label: 'Request', icon: 'arrow-right' },
  { id: 'response', label: 'Response', icon: 'arrow-left' },
];
const fixedActive = ref<string | undefined>('request');
</script>

<template>
  <Specimen
    title="EditorTabs"
    note="IDE-style strip for multi-document editing surfaces — a document list whose entries open and close at runtime, not the Tabs compound. The caller owns the tab list: close and reorder events only ask. Right-click a tab for the close menu; drag one to reorder. The dot marks unsaved changes, and the strip renders nothing when the list is empty — the caller's empty state belongs to the caller."
  >
    <div class="sb__stack">
      <EditorTabs
        v-model="active"
        :tabs="tabs"
        mono
        @close="close"
        @close-others="closeOthers"
        @close-right="closeRight"
        @close-all="closeAll"
        @reorder="reorder"
      />
      <p class="sb__state">
        Active: <code>{{ active ?? 'none' }}</code> · Order:
        <code>{{ tabs.length > 0 ? tabs.map((t) => t.id).join(', ') : '(empty — the strip is gone)' }}</code>
      </p>
      <div v-if="tabs.length === 0" class="sb__row">
        <Button variant="outlined" size="sm" icon="rotate-ccw" @click="reset">Reopen tabs</Button>
      </div>
    </div>
  </Specimen>

  <Specimen
    title="Fixed strip"
    note="closable=false is for surfaces that auto-open a fixed set of tabs for the life of the view; it also gates the right-click menu and drag-to-reorder, because a fixed strip owns its tab order and lifecycle."
  >
    <EditorTabs v-model="fixedActive" :tabs="FIXED" :closable="false" />
  </Specimen>
  <CodeExample :code="editorTabsExample" />

  <PropsTable :rows="editorTabsProps" />
  <PropsTable :rows="editorTabProps" title="EditorTab" note="Tab shape for `tabs`." />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
