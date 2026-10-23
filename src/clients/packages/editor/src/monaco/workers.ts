// Wire up Monaco's language workers. Each language Monaco supports ships a dedicated
// worker script (json.worker.js etc.) that runs the language service off the main thread.
// Without `self.MonacoEnvironment.getWorker` set, the standalone editor still renders but
// quietly skips registering its language clients — so JSON validation, IntelliSense, and
// schema-driven features all silently do nothing. (No console error, no squiggles, just
// no validation.)
//
// Vite's `?worker` suffix turns each script into a constructable Worker class with the
// correct module resolution. Imported for side effect by JsonEditor.vue; the assignment
// runs at module load, which is before any `monaco.editor.create` call in this package.
//
// Only `json` is wired here because that's the only Monaco language we use. If another
// language is added (yaml, ts, css, html), import its worker and extend the switch.

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new JsonWorker();
    return new EditorWorker();
  },
};
