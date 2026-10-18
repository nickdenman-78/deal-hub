<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useEditorAppearance } from '../appearance';
import '../monaco/workers';
import * as monaco from 'monaco-editor';
import '../monaco/jsonc';

// JSON Monaco wrapper with optional per-URI model caching. When `uri` is supplied the editor
// keeps a Map<uri, ITextModel> for its lifetime — switching the active uri swaps Monaco's
// model rather than calling setValue, so each "file" preserves its own undo stack, cursor
// position, and scroll. That's how VS Code feels seamless between tabs. When `uri` is
// omitted, the editor behaves like a single in-place model.
//
// `modelValue` is the *active* model's contents. External setValue happens only when the
// parent's modelValue diverges from what the current model already has (e.g. a reload, or
// the parent reset draft to server contents). Typing emits update:modelValue against the
// currently-active model.

const props = withDefaults(
  defineProps<{
    modelValue: string;
    uri?: string;
    readOnly?: boolean;
    language?: string;
    autoHeight?: boolean;
    /** Override host theme. `null` = follow `data-theme` / plugin. */
    isDark?: boolean | null;
    /**
     * Optional per-model diagnostic pass. Debounced, and re-run whenever the
     * content changes or the active model is swapped.
     *
     * INJECTED rather than imported, and that is the whole reason this
     * component could move here: the only scanner we have understands
     * config-server's `$__ref` / `$__secret` markers and reads three Pinia
     * stores. That is domain knowledge and must not enter this package.
     *
     * Omit it and the editor publishes no markers of its own — Monaco's own
     * JSON diagnostics are unaffected either way.
     */
    scanMarkers?: (model: monaco.editor.ITextModel) => monaco.editor.IMarkerData[];
    /**
     * Namespaces our markers so `setModelMarkers` replaces only ours and leaves
     * the language service's alone. A caller passing `scanMarkers` should pass a
     * stable id of its own.
     */
    markerOwner?: string;
    markerDebounceMs?: number;
  }>(),
  {
    language: 'json',
    isDark: null,
    scanMarkers: undefined,
    markerOwner: 'ets.editor',
    markerDebounceMs: 200,
  },
);
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const host = ref<HTMLDivElement | null>(null);
const isDark = useEditorAppearance(() => props.isDark);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let suppressEmit = false;
const models = new Map<string, monaco.editor.ITextModel>();
let onChangeDisposer: monaco.IDisposable | null = null;
let contentSizeDisposer: monaco.IDisposable | null = null;
let markerTimer: ReturnType<typeof setTimeout> | null = null;

function refreshMarkers(m: monaco.editor.ITextModel) {
  // No scanner, nothing to publish. Read-only content is skipped too: markers
  // point at things the reader cannot act on.
  if (!props.scanMarkers || props.readOnly === true) return;
  monaco.editor.setModelMarkers(m, props.markerOwner, props.scanMarkers(m));
}

function scheduleMarkerRefresh(m: monaco.editor.ITextModel) {
  if (!props.scanMarkers || props.readOnly === true) return;
  if (markerTimer) clearTimeout(markerTimer);
  markerTimer = setTimeout(() => refreshMarkers(m), props.markerDebounceMs);
}

function applyMonacoTheme() {
  monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs');
}

// When autoHeight is set, the host grows to exactly Monaco's content height so the
// editor shows every line with no inner scrollbar — suited to short, fixed snippets.
// Safe against layout feedback because content height is wrap-independent here.
function fitHeightToContent() {
  if (!editor || !host.value) return;
  host.value.style.height = `${editor.getContentHeight()}px`;
  editor.layout();
}

const INLINE_KEY = '__inline__';

function keyFor(uri: string | undefined): string {
  return uri ?? INLINE_KEY;
}

function getOrCreateModel(uri: string | undefined, content: string): monaco.editor.ITextModel {
  const k = keyFor(uri);
  let m = models.get(k);
  if (!m) {
    m = uri
      ? monaco.editor.createModel(content, props.language, monaco.Uri.parse(`inmemory:///${uri}`))
      : monaco.editor.createModel(content, props.language);
    models.set(k, m);
  } else if (m.getValue() !== content) {
    // Parent-driven content change (reload, discard) while we already had a cached model.
    suppressEmit = true;
    m.setValue(content);
    suppressEmit = false;
  }
  return m;
}

function attachOnChange(m: monaco.editor.ITextModel) {
  onChangeDisposer?.dispose();
  onChangeDisposer = m.onDidChangeContent(() => {
    if (suppressEmit || !editor) return;
    // Only emit if this model is the one currently shown — defensive against late events.
    if (editor.getModel() !== m) return;
    emit('update:modelValue', m.getValue());
    scheduleMarkerRefresh(m);
  });
}

onMounted(() => {
  if (!host.value) return;
  applyMonacoTheme();
  const initial = getOrCreateModel(props.uri, props.modelValue);
  editor = monaco.editor.create(host.value, {
    model: initial,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    readOnly: props.readOnly === true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    theme: isDark.value ? 'vs-dark' : 'vs',
  });
  attachOnChange(initial);
  refreshMarkers(initial);
  if (props.autoHeight) {
    contentSizeDisposer = editor.onDidContentSizeChange(fitHeightToContent);
    fitHeightToContent();
  }
});

watch(
  () => props.uri,
  (uri) => {
    if (!editor) return;
    const next = getOrCreateModel(uri, props.modelValue);
    editor.setModel(next);
    attachOnChange(next);
    refreshMarkers(next);
  },
);

watch(
  () => props.modelValue,
  (next) => {
    if (!editor) return;
    const m = editor.getModel();
    if (!m) return;
    if (m.getValue() === next) return;
    suppressEmit = true;
    m.setValue(next);
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
  if (markerTimer) clearTimeout(markerTimer);
  onChangeDisposer?.dispose();
  contentSizeDisposer?.dispose();
  editor?.dispose();
  editor = null;
  for (const m of models.values()) m.dispose();
  models.clear();
});
</script>

<template>
  <div ref="host" class="r-json-editor"></div>
</template>

<style>
/* Size is fully driven by the parent. Monaco's automaticLayout reads the host element's
   computed dimensions; setting a min-height here lets the editor balloon to its content
   height whenever the parent yields vertical space. The parent is responsible for giving
   the host a real height (flex: 1 + min-height: 0 in a flex column, typically). */
.r-json-editor {
  width: 100%;
  height: 100%;
}
</style>
