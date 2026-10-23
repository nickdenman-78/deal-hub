<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useEditorAppearance } from '../appearance';
import '../monaco/workers';
import * as monaco from 'monaco-editor';

// Monaco wrapper configured for markdown editing. Sibling to JsonEditor: same lifecycle,
// same `suppressEmit` guard against the parent's `setValue` re-triggering our change handler,
// just with markdown grammar, word wrap, and the minimap disabled — descriptions are prose,
// not config. Does NOT import jsonc: that side-effect module is for JSON-facing editors only.
const props = withDefaults(
  defineProps<{ modelValue: string; readOnly?: boolean; minHeight?: string; isDark?: boolean | null }>(),
  {
    minHeight: '14rem',
    isDark: null,
  },
);
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const host = ref<HTMLDivElement | null>(null);
const isDark = useEditorAppearance(() => props.isDark);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let suppressEmit = false;

// Monaco's setTheme is global — one call updates every editor instance. Calling it before
// `editor.create` also avoids a brief flash of the default light theme on dark sessions.
function applyMonacoTheme() {
  monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs');
}

onMounted(() => {
  if (!host.value) return;
  applyMonacoTheme();
  editor = monaco.editor.create(host.value, {
    value: props.modelValue,
    language: 'markdown',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    readOnly: props.readOnly === true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'off',
    folding: false,
    tabSize: 2,
    renderLineHighlight: 'none',
    theme: isDark.value ? 'vs-dark' : 'vs',
  });
  editor.onDidChangeModelContent(() => {
    if (suppressEmit || !editor) return;
    emit('update:modelValue', editor.getValue());
  });
});

watch(
  () => props.modelValue,
  (next) => {
    if (!editor) return;
    if (editor.getValue() === next) return;
    suppressEmit = true;
    editor.setValue(next);
    suppressEmit = false;
  },
);

watch(
  () => props.readOnly,
  (ro) => {
    editor?.updateOptions({ readOnly: ro === true });
  },
);

watch(isDark, applyMonacoTheme);

onBeforeUnmount(() => {
  editor?.dispose();
  editor = null;
});
</script>

<template>
  <div ref="host" class="r-markdown-editor" :style="{ minHeight }"></div>
</template>

<style scoped>
.r-markdown-editor {
  width: 100%;
  overflow: hidden;
}
</style>
