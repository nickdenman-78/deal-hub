<script setup lang="ts">
/*
 * Markdown comes in by SUBPATH because @ets/editor's barrel is Monaco-only.
 * Note the missing .vue: the exports pattern is "./components/*" ->
 * "./src/components/*.vue", so writing it resolves to *.vue.vue.
 *
 * Markdown IS pure CSS, so it goes back to the light/dark pairing via Specimen.
 */
import MarkdownView from '@ets/editor/components/MarkdownView';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { markdownViewExample } from '../../apiExamples';
import { markdownViewProps } from '../../apiDocs';

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
  <Specimen
    title="MarkdownView"
    note="Rendered through markdown-it and sanitised by DOMPurify. The script tag and the onerror handler in the source above are both stripped — that allow-list is the security test that moved into this package verbatim. maxHeight is unset by default: a height limit that nobody asked for silently hides content."
  >
    <MarkdownView :source="markdown" />
  </Specimen>
  <CodeExample :code="markdownViewExample" />

  <PropsTable :rows="markdownViewProps" />
</template>
