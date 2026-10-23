<script setup lang="ts">
/*
 * Markdown comes in by SUBPATH because @ets/editor's barrel is Monaco-only.
 * Note the missing .vue: the exports pattern is "./components/*" ->
 * "./src/components/*.vue", so writing it resolves to *.vue.vue.
 *
 * Markdown IS pure CSS, so it goes back to the light/dark pairing via Specimen.
 */
import MarkdownExcerpt from '@ets/editor/components/MarkdownExcerpt';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { markdownExcerptExample } from '../../apiExamples';
import { markdownExcerptProps } from '../../apiDocs';

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
    title="MarkdownExcerpt"
    note="One line of plain text for a table cell or a card. Renders NOTHING when the source is empty, so a cell collapses rather than reserving space for a description that is not there — the second row below is the empty case."
  >
    <MarkdownExcerpt :source="markdown" />
    <MarkdownExcerpt :source="null" />
    <MarkdownExcerpt source="A short description that will be cut well before it reaches its limit." :max-chars="40" />
  </Specimen>
  <CodeExample :code="markdownExcerptExample" />

  <PropsTable :rows="markdownExcerptProps" />
</template>
