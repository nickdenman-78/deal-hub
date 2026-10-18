<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';
import * as Diff3 from 'node-diff3';
import { useEditorAppearance } from '../appearance';
import { useEditorChrome } from '../chrome';
import '../monaco/workers';
import '../monaco/jsonc';

// Three-way merge editor. Splits the file's three states (Base, Theirs, Mine) into
// line-aligned regions via `node-diff3` and surfaces:
//   - Theirs (top-left, read-only) with inline `Accept theirs / Accept both` buttons over
//     each conflict region.
//   - Mine (top-right, read-only) with inline `Accept mine / Accept both` buttons.
//   - Result (bottom, editable Monaco) — initial content is the diff3 output with
//     `<<<<<<< theirs / ======= / >>>>>>> mine` markers around each conflict. The accept
//     buttons replace the marker block in Result with the chosen content. The operator can
//     also hand-edit Result. `Confirm merge` stays disabled while any marker line remains.
//
// Base is not shown — it's the common ancestor that the merge algorithm needs but which
// rarely helps an operator deciding between two divergent texts.

const props = withDefaults(
  defineProps<{ base: string; theirs: string; mine: string; language?: string; isDark?: boolean | null }>(),
  {
    language: 'json',
    isDark: null,
  },
);

const emit = defineEmits<{ confirm: [result: string]; cancel: [] }>();

// One conflict chunk derived from the diff3 regions. Line ranges are 1-indexed inclusive,
// matching Monaco's convention.
interface Chunk {
  index: number;
  theirsLines: string[];
  mineLines: string[];
  theirsRange: { startLine: number; endLine: number };
  mineRange: { startLine: number; endLine: number };
  // The exact marker block as it appears in Result before any user resolution. We replace
  // by literal-string match so manual edits to non-conflict regions don't shift indices.
  markerBlock: string;
}

const isDark = useEditorAppearance(() => props.isDark);
const chrome = useEditorChrome();
const chunks = ref<Chunk[]>([]);
const result = ref('');

const theirsHost = ref<HTMLDivElement | null>(null);
const mineHost = ref<HTMLDivElement | null>(null);
const resultHost = ref<HTMLDivElement | null>(null);

let theirsEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let mineEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let resultEditor: monaco.editor.IStandaloneCodeEditor | null = null;

let theirsModel: monaco.editor.ITextModel | null = null;
let mineModel: monaco.editor.ITextModel | null = null;
let resultModel: monaco.editor.ITextModel | null = null;

let theirsDecorations: monaco.editor.IEditorDecorationsCollection | null = null;
let mineDecorations: monaco.editor.IEditorDecorationsCollection | null = null;
const theirsWidgets: monaco.editor.IContentWidget[] = [];
const mineWidgets: monaco.editor.IContentWidget[] = [];

// Detects any of the three marker line prefixes. Multi-line mode so `^` matches each line.
const hasUnresolvedMarkers = computed(() => /^(<{7} theirs|={7}|>{7} mine)/m.test(result.value));

function applyTheme() {
  monaco.editor.setTheme(isDark.value ? 'vs-dark' : 'vs');
}

function computeChunks() {
  const theirsArr = props.theirs.split('\n');
  const baseArr = props.base.split('\n');
  const mineArr = props.mine.split('\n');

  // node-diff3 yields an array of regions, each either { ok: string[] } (non-conflicting,
  // shared by all three) or { conflict: { a, o, b, ...indices } } (divergent).
  // Order of params: a = theirs, o = base, b = mine.
  const regions = Diff3.diff3Merge(theirsArr, baseArr, mineArr, {
    excludeFalseConflicts: true,
  });

  const resultLines: string[] = [];
  const newChunks: Chunk[] = [];
  let chunkIndex = 0;
  let theirsCursor = 1; // 1-indexed line number in the Theirs document
  let mineCursor = 1;

  for (const region of regions) {
    // node-diff3's MergeRegion type declares both `ok` and `conflict` as optional, so
    // `in` doesn't narrow. Truthiness check works because exactly one is set at runtime.
    const ok = region.ok;
    const conflict = region.conflict;
    if (ok) {
      resultLines.push(...ok);
      theirsCursor += ok.length;
      mineCursor += ok.length;
    } else if (conflict) {
      const markerLines = ['<<<<<<< theirs', ...conflict.a, '=======', ...conflict.b, '>>>>>>> mine'];
      resultLines.push(...markerLines);
      newChunks.push({
        index: chunkIndex++,
        theirsLines: conflict.a,
        mineLines: conflict.b,
        theirsRange: {
          startLine: theirsCursor,
          endLine: theirsCursor + Math.max(conflict.a.length, 1) - 1,
        },
        mineRange: {
          startLine: mineCursor,
          endLine: mineCursor + Math.max(conflict.b.length, 1) - 1,
        },
        markerBlock: markerLines.join('\n'),
      });
      theirsCursor += conflict.a.length;
      mineCursor += conflict.b.length;
    }
  }

  chunks.value = newChunks;
  result.value = resultLines.join('\n');
}

function acceptChunk(chunk: Chunk, choice: 'theirs' | 'mine' | 'both') {
  const replacement =
    choice === 'theirs'
      ? chunk.theirsLines.join('\n')
      : choice === 'mine'
        ? chunk.mineLines.join('\n')
        : [...chunk.theirsLines, ...chunk.mineLines].join('\n');

  const current = resultModel?.getValue() ?? result.value;
  // Literal-string match. If the operator has already edited this block, the click is a
  // no-op — they own the manual resolution.
  const idx = current.indexOf(chunk.markerBlock);
  if (idx === -1) return;

  const next = current.slice(0, idx) + replacement + current.slice(idx + chunk.markerBlock.length);
  resultModel?.setValue(next);
  // onDidChangeContent below mirrors the value into result.value for the Confirm gate.
}

function buildAcceptWidget(
  chunk: Chunk,
  side: 'theirs' | 'mine',
  range: { startLine: number; endLine: number },
): monaco.editor.IContentWidget {
  const node = document.createElement('div');
  node.className = 'r-merge-accept-widget';
  // Raw HTML is enough — these widgets are short-lived per merge session and don't need
  // Vue reactivity. Buttons emit clicks via a single delegated listener.
  node.innerHTML = `
    <button type="button" data-action="side" class="r-merge-btn r-merge-btn--primary">
      Accept ${side}
    </button>
    <button type="button" data-action="both" class="r-merge-btn r-merge-btn--secondary">
      Accept both
    </button>
  `;
  node.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'side') acceptChunk(chunk, side);
    else if (action === 'both') acceptChunk(chunk, 'both');
  });

  return {
    getId: () => `merge-accept-${side}-${chunk.index}`,
    getDomNode: () => node,
    getPosition: () => ({
      position: { lineNumber: range.startLine, column: 1 },
      preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
    }),
  };
}

function clearOverlays() {
  while (theirsWidgets.length) {
    const w = theirsWidgets.pop()!;
    theirsEditor?.removeContentWidget(w);
  }
  while (mineWidgets.length) {
    const w = mineWidgets.pop()!;
    mineEditor?.removeContentWidget(w);
  }
  theirsDecorations?.clear();
  mineDecorations?.clear();
  theirsDecorations = null;
  mineDecorations = null;
}

function rebuildOverlays() {
  clearOverlays();

  if (theirsEditor) {
    const decoRanges = chunks.value.map((chunk) => ({
      range: new monaco.Range(chunk.theirsRange.startLine, 1, chunk.theirsRange.endLine, 1),
      options: {
        isWholeLine: true,
        className: 'r-merge-conflict-region r-merge-conflict-theirs',
      },
    }));
    theirsDecorations = theirsEditor.createDecorationsCollection(decoRanges);
    chunks.value.forEach((chunk) => {
      const w = buildAcceptWidget(chunk, 'theirs', chunk.theirsRange);
      theirsEditor!.addContentWidget(w);
      theirsWidgets.push(w);
    });
  }

  if (mineEditor) {
    const decoRanges = chunks.value.map((chunk) => ({
      range: new monaco.Range(chunk.mineRange.startLine, 1, chunk.mineRange.endLine, 1),
      options: {
        isWholeLine: true,
        className: 'r-merge-conflict-region r-merge-conflict-mine',
      },
    }));
    mineDecorations = mineEditor.createDecorationsCollection(decoRanges);
    chunks.value.forEach((chunk) => {
      const w = buildAcceptWidget(chunk, 'mine', chunk.mineRange);
      mineEditor!.addContentWidget(w);
      mineWidgets.push(w);
    });
  }
}

onMounted(() => {
  applyTheme();
  computeChunks();

  if (!theirsHost.value || !mineHost.value || !resultHost.value) return;

  theirsModel = monaco.editor.createModel(props.theirs, props.language);
  mineModel = monaco.editor.createModel(props.mine, props.language);
  resultModel = monaco.editor.createModel(result.value, props.language);

  const commonOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    lineNumbers: 'on',
    theme: isDark.value ? 'vs-dark' : 'vs',
  };

  theirsEditor = monaco.editor.create(theirsHost.value, {
    ...commonOptions,
    model: theirsModel,
    readOnly: true,
  });
  mineEditor = monaco.editor.create(mineHost.value, {
    ...commonOptions,
    model: mineModel,
    readOnly: true,
  });
  resultEditor = monaco.editor.create(resultHost.value, {
    ...commonOptions,
    model: resultModel,
    readOnly: false,
  });

  // Mirror result-editor edits into the ref so the Confirm gate stays in sync.
  resultModel.onDidChangeContent(() => {
    result.value = resultModel!.getValue();
  });

  rebuildOverlays();
});

watch(
  () => [props.base, props.theirs, props.mine],
  () => {
    computeChunks();
    theirsModel?.setValue(props.theirs);
    mineModel?.setValue(props.mine);
    resultModel?.setValue(result.value);
    rebuildOverlays();
  },
);

watch(isDark, applyTheme);

onBeforeUnmount(() => {
  clearOverlays();
  theirsEditor?.dispose();
  mineEditor?.dispose();
  resultEditor?.dispose();
  theirsModel?.dispose();
  mineModel?.dispose();
  resultModel?.dispose();
  theirsEditor = null;
  mineEditor = null;
  resultEditor = null;
  theirsModel = null;
  mineModel = null;
  resultModel = null;
});

function onConfirm() {
  emit('confirm', result.value);
}
function onCancel() {
  emit('cancel');
}
</script>

<template>
  <div class="r-merge-editor">
    <div class="r-merge-editor__panes">
      <div class="r-merge-editor__pane">
        <div class="r-merge-editor__header r-merge-editor__header--theirs">
          <span class="r-merge-editor__title">Theirs (incoming)</span>
        </div>
        <div ref="theirsHost" class="r-merge-editor__host"></div>
      </div>
      <div class="r-merge-editor__pane">
        <div class="r-merge-editor__header r-merge-editor__header--mine">
          <span class="r-merge-editor__title">Mine (your draft)</span>
        </div>
        <div ref="mineHost" class="r-merge-editor__host"></div>
      </div>
    </div>
    <div class="r-merge-editor__pane r-merge-editor__pane--result">
      <div class="r-merge-editor__header r-merge-editor__header--result">
        <span class="r-merge-editor__title">Result</span>
        <span v-if="hasUnresolvedMarkers" class="r-merge-editor__warn">
          Resolve all conflict markers to enable Confirm
        </span>
      </div>
      <div ref="resultHost" class="r-merge-editor__host"></div>
    </div>
    <div class="r-merge-editor__footer">
      <slot name="footer" :disabled="hasUnresolvedMarkers" :confirm="onConfirm" :cancel="onCancel">
        <component :is="chrome.Button" v-if="chrome.Button" variant="outlined" @click="onCancel">Cancel</component>
        <button v-else type="button" class="r-merge-editor__action" @click="onCancel">Cancel</button>

        <component
          :is="chrome.Button"
          v-if="chrome.Button"
          severity="primary"
          icon="check"
          :disabled="hasUnresolvedMarkers"
          @click="onConfirm"
        >
          Confirm merge
        </component>
        <button
          v-else
          type="button"
          class="r-merge-editor__action r-merge-editor__action--primary"
          :disabled="hasUnresolvedMarkers"
          @click="onConfirm"
        >
          Confirm merge
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
/* Structural layout only. Brand colours for headers, borders, and accept widgets live in
   `@ets/ui/styles/editor.css` (or a host stylesheet targeting these class hooks). */
.r-merge-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 80vh;
  min-height: 0;
}
.r-merge-editor__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}
.r-merge-editor__pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.r-merge-editor__pane--result {
  flex: 1;
  min-height: 0;
}
.r-merge-editor__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.r-merge-editor__warn {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-weight: 500;
}
.r-merge-editor__host {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.r-merge-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.25rem;
}
.r-merge-editor__action {
  font: inherit;
  cursor: pointer;
}
.r-merge-editor__action:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
