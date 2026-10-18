<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useEditorAppearance } from '../appearance';
import '../monaco/workers';
import * as monaco from 'monaco-editor';
import '../monaco/jsonc';

// Side-by-side, read-only Monaco DiffEditor. `original` renders in the left pane (typically a
// historical snapshot), `modified` in the right (the current file). Both follow the global
// Monaco JSON diagnostics (jsonc with comments allowed) and the host's appearance signal.
// The component re-mounts the underlying models on prop change so switching between snapshots
// is one `setModel` call rather than a full editor rebuild.
const props = withDefaults(
  defineProps<{ original: string; modified: string; language?: string; isDark?: boolean | null }>(),
  {
    language: 'json',
    isDark: null,
  },
);

const host = ref<HTMLDivElement | null>(null);
const isDark = useEditorAppearance(() => props.isDark);
let editor: monaco.editor.IStandaloneDiffEditor | null = null;
let originalModel: monaco.editor.ITextModel | null = null;
let modifiedModel: monaco.editor.ITextModel | null = null;

function applyTheme() {
  monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs');
}

function buildModels() {
  // Each render gets fresh models so the diff view's "changed" decorations are recomputed
  // from scratch. Disposing the previous pair before assigning the new ones avoids the
  // memory leak that would otherwise pile up across snapshot switches.
  originalModel?.dispose();
  modifiedModel?.dispose();
  originalModel = monaco.editor.createModel(props.original, props.language);
  modifiedModel = monaco.editor.createModel(props.modified, props.language);
}

onMounted(() => {
  if (!host.value) return;
  applyTheme();
  editor = monaco.editor.createDiffEditor(host.value, {
    automaticLayout: true,
    readOnly: true,
    renderSideBySide: true,
    minimap: { enabled: false },
    fontSize: 13,
    scrollBeyondLastLine: false,
    theme: isDark.value ? 'vs-dark' : 'vs',
  });
  buildModels();
  editor.setModel({ original: originalModel!, modified: modifiedModel! });
});

watch([() => props.original, () => props.modified, () => props.language], () => {
  if (!editor) return;
  buildModels();
  editor.setModel({ original: originalModel!, modified: modifiedModel! });
});

watch(isDark, applyTheme);

onBeforeUnmount(() => {
  editor?.dispose();
  editor = null;
  originalModel?.dispose();
  modifiedModel?.dispose();
  originalModel = null;
  modifiedModel = null;
});
</script>

<template>
  <div ref="host" class="r-diff-viewer"></div>
</template>

<style scoped>
.r-diff-viewer {
  width: 100%;
  height: 100%;
  min-height: 18rem;
}
</style>
