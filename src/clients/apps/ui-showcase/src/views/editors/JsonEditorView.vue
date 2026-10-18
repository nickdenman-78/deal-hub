<script setup lang="ts">
/*
 * Monaco needs measured layout and jsdom has none, so jsdom tests for these
 * would be vacuous or flaky — the package's vite.config.ts says so. This page
 * is the substitute, which makes it worth opening after any change to them.
 *
 * WHY THE IMPORTS HERE ARE STATIC. ADR-0010's rule is that anything reachable
 * from an app's ROOT component must use defineAsyncComponent — that is the rule
 * config-admin's DraftRecoveryDrawer broke, putting 4MB of Monaco in its entry
 * chunk. A lazily-routed view is already behind a dynamic import, so static
 * imports here land in this route's chunk and nowhere else.
 *
 * MarkerSeverity comes from @ets/editor/monaco/markers rather than from
 * `monaco-editor`, so nothing in this app's own source imports Monaco.
 */
import { JsonEditor } from '@ets/editor';
import { MarkerSeverity, type editor } from '@ets/editor/monaco/markers';
import { Message, useTheme } from '@ets/ui';
import { ref } from 'vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { jsonEditorExample } from '../../apiExamples';
import { jsonEditorProps } from '../../apiDocs';

const { isDark } = useTheme();

const json = ref(`{
  // jsonc: comments are allowed, and the language service knows it.
  "service": "pricing-api",
  "environment": "test",
  "retries": 3,
  "endpoint": "https://example.invalid/v1",
  "note": "TODO: point this at the real host"
}`);

/*
 * The injection seam, demonstrated with a toy.
 *
 * config-admin's real scanner is 946 lines that read three Pinia stores and
 * understand $__ref / $__secret. JsonEditor knows none of that — it takes a
 * function. Anything that can produce markers for a model fits, including this,
 * which just flags TODO in string values.
 */
function scanForTodos(model: editor.ITextModel): editor.IMarkerData[] {
  const markers: editor.IMarkerData[] = [];
  for (let line = 1; line <= model.getLineCount(); line++) {
    const text = model.getLineContent(line);
    const at = text.indexOf('TODO');
    if (at === -1) continue;
    markers.push({
      severity: MarkerSeverity.Warning,
      message: 'Left-over TODO.',
      startLineNumber: line,
      endLineNumber: line,
      startColumn: at + 1,
      endColumn: at + 5,
    });
  }
  return markers;
}

const READ_ONLY = `{
  "resolved": true,
  "keys": 12
}`;
</script>

<template>
  <Message severity="info">
    <strong>These are not in <code>@ets/ui</code>, deliberately.</strong> <code>monaco-editor</code> is ~5MB with
    bundler-specific worker wiring, and under the raw-source rule every dependency of a shared package becomes an
    <code>optimizeDeps.include</code> entry in every app that uses it. An app with no editor pays nothing for this one.
  </Message>

  <!--
    Monaco sections do NOT use <Specimen>, and that is a real constraint rather
    than an oversight: monaco.editor.setTheme is a GLOBAL call, so two editors
    on one page cannot show different themes. Forcing data-theme on a wrapper
    re-themes @ets/ui's chrome around them and leaves the editors alone,
    which looks like a bug and is not. Use the toolbar toggle instead — these
    watch it and re-apply.
  -->
  <section class="sb__section">
    <h3>JsonEditor</h3>
    <p>
      jsonc — comments allowed. Currently rendering <strong>{{ isDark ? 'vs-dark' : 'vs' }}</strong
      >, followed from the toolbar toggle. Type <code>TODO</code> anywhere in a string to see the injected scanner mark
      it; the squiggle needs the JSON language worker, so its presence is also a check that worker wiring survived.
    </p>
    <div class="ed-demo__frame">
      <JsonEditor
        v-model="json"
        uri="showcase://pricing-api.json"
        :scan-markers="scanForTodos"
        marker-owner="showcase"
      />
    </div>
  </section>

  <section class="sb__section">
    <h3>JsonEditor — read-only, auto-height</h3>
    <p>
      <code>autoHeight</code> sizes to the content instead of filling its host, for short payloads embedded in a page.
      No scanner is passed here, so marker refresh no-ops entirely.
    </p>
    <JsonEditor :model-value="READ_ONLY" read-only auto-height />
  </section>
  <CodeExample :code="jsonEditorExample" />

  <PropsTable :rows="jsonEditorProps" />
</template>

<style scoped>
/* Monaco reads its host's computed height, so a host with no height gives an
   editor 5px tall and no error. JsonEditor is height:100% of whatever it is
   given and needs this. */
.ed-demo__frame {
  height: 22rem;
}
</style>
