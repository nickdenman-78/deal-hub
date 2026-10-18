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
import { DiffViewer } from '@ets/editor';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { diffViewerExample } from '../../apiExamples';
import { diffViewerProps } from '../../apiDocs';

const DIFF_BEFORE = `{
  "retries": 3,
  "timeoutSeconds": 30,
  "endpoint": "https://old.invalid/v1"
}`;

const DIFF_AFTER = `{
  "retries": 5,
  "timeoutSeconds": 30,
  "endpoint": "https://new.invalid/v2",
  "circuitBreaker": true
}`;
</script>

<template>
  <section class="sb__section">
    <h3>DiffViewer</h3>
    <p>Side-by-side, read-only. This is the component config-admin loads asynchronously for draft recovery.</p>
    <div class="ed-demo__frame">
      <DiffViewer :original="DIFF_BEFORE" :modified="DIFF_AFTER" />
    </div>
  </section>
  <CodeExample :code="diffViewerExample" />

  <PropsTable :rows="diffViewerProps" />
</template>

<style scoped>
/* Monaco reads its host's computed height, so a host with no height gives an
   editor 5px tall and no error. DiffViewer is height:100% of whatever it is
   given and needs this. */
.ed-demo__frame {
  height: 22rem;
}
</style>
