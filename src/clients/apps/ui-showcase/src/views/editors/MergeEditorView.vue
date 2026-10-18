<script setup lang="ts">
/*
 * WHY THE IMPORTS HERE ARE STATIC. ADR-0010's rule is that anything reachable
 * from an app's ROOT component must use defineAsyncComponent. A lazily-routed
 * view is already behind a dynamic import, so static imports here land in this
 * route's chunk and nowhere else.
 *
 * Monaco sections do NOT use <Specimen>: monaco.editor.setTheme is a GLOBAL
 * call, so two editors on one page cannot show different themes.
 */
import { MergeEditor } from '@ets/editor';
import { Button } from '@ets/ui';
import { ref } from 'vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { mergeEditorExample } from '../../apiExamples';
import { mergeEditorProps } from '../../apiDocs';

// Three-way: a common ancestor plus two edits to the same key, which is what
// makes it conflict rather than merge cleanly.
const MERGE_BASE = `{
  "retries": 3,
  "owner": "desk"
}`;
const MERGE_THEIRS = `{
  "retries": 9,
  "owner": "desk",
  "addedByThem": true
}`;
const MERGE_MINE = `{
  "retries": 1,
  "owner": "platform"
}`;

const mergeResult = ref<string | null>(null);
</script>

<template>
  <section class="sb__section">
    <h3>MergeEditor</h3>
    <p>
      Three-way, on <code>node-diff3</code>. <code>retries</code> and <code>owner</code> conflict; the key only one side
      added merges cleanly and never appears as a choice. Resolve both, then confirm.
    </p>
    <p>
      <strong>Unlike the others, this one sizes itself</strong> — its root is <code>height: 80vh</code>, because its
      only real call site is a full-screen conflict modal. Putting it in a fixed-height host does not shrink it, it just
      makes it overflow onto whatever follows.
    </p>
    <MergeEditor
      :base="MERGE_BASE"
      :theirs="MERGE_THEIRS"
      :mine="MERGE_MINE"
      @confirm="(result: string) => (mergeResult = result)"
      @cancel="mergeResult = null"
    />
    <template v-if="mergeResult !== null">
      <p class="ed-demo__label">Emitted on confirm:</p>
      <pre class="ed-demo__out">{{ mergeResult }}</pre>
      <Button variant="text" size="sm" @click="mergeResult = null">Clear</Button>
    </template>
  </section>
  <CodeExample :code="mergeEditorExample" />

  <PropsTable :rows="mergeEditorProps" />
</template>

<style scoped>
.ed-demo__label {
  margin-top: var(--sp-3);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.ed-demo__out {
  padding: var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  overflow-x: auto;
}
</style>
