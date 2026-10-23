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
import { MarkdownEditor } from '@ets/editor';
import { ref } from 'vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { markdownEditorExample } from '../../apiExamples';
import { markdownEditorProps } from '../../apiDocs';

/*
 * Assembled rather than written out, and it has to be a REAL closing tag or the
 * specimen below proves nothing. Written literally it would end this
 * <script setup> block; written as `<\/script>` it is a useless escape and
 * eslint rejects it. Concatenation is the one form that is neither.
 */
const CLOSE_SCRIPT = '</' + 'script>';

const markdown = ref(`# Pricing API

Serves indicative prices to the trading desk.

- **Owner:** trading desk
- **On call:** \`#pricing-support\`

> Rates refresh every 30 seconds.

Sanitisation is the point of the renderer, not a side effect —
<script>alert('xss')${CLOSE_SCRIPT} and <img src=x onerror="alert(1)"> are both
stripped by the DOMPurify allow-list. Nothing below should pop a dialog.
`);
</script>

<template>
  <section class="sb__section">
    <h3>MarkdownEditor</h3>
    <p>Monaco in markdown mode. Its output feeds the renderer below — the two halves of an edit/preview pairing.</p>
    <MarkdownEditor v-model="markdown" />
  </section>
  <CodeExample :code="markdownEditorExample" />

  <PropsTable :rows="markdownEditorProps" />
</template>
