/*
 * @ets/editor — headless Monaco code editors and sanitised markdown.
 *
 * Split out of @ets/ui deliberately, and the reason is a dependency budget
 * rather than a taste call. `monaco-editor` is ~5MB and its worker wiring is
 * bundler-specific; `markdown-it` + `dompurify` are lighter but not free. Under
 * this workspace's raw-source rule (see src/clients/CONTEXT.md) every consuming
 * app must list a package's runtime dependencies in `optimizeDeps.include`, so
 * anything living in @ets/ui's barrel taxes EVERY consumer with entries it
 * may never use. Keeping this separate is what lets a new app adopt @ets/ui
 * on day one without inheriting a code editor.
 *
 * This package has ZERO runtime dependency on `@ets/ui` / `@ets/brand`.
 * Appearance (`isDark` for Monaco) and chrome (Icon / Dialog / Input / Button)
 * are injected via `@ets/editor/appearance` and `@ets/editor/chrome`.
 * Stanwell apps install `createEtsEditorPlugin()` from `@ets/ui` and
 * import `@ets/ui/styles/editor.css` for the branded skin.
 *
 * Consumed as raw source exactly like @ets/ui: `workspace:*` plus an
 * `exports` map pointing at .ts/.vue. No build step.
 *
 * `monaco-editor` is an OPTIONAL peer dependency, and catalogued. Optional
 * because the Tiptap side of this package — SimpleMarkdownEditor — reaches none
 * of it, and the build output says so rather than the import graph merely
 * implying it: that component's chunk is ~380KB with zero Monaco references,
 * while the Monaco chunk carries no Tiptap. An app that wants rich text and no
 * code editor should not have to install a 5MB dependency to satisfy a peer it
 * never loads.
 *
 * It is still a peer rather than a dependency because its language services
 * are global registries — a completion provider registered against one copy is
 * invisible to an editor rendered by another. Two resolved copies would not
 * error; completions would just silently never appear. Same failure the
 * workspace catalog comment already records for @vuetify/v0.
 *
 * NEVER add `"sideEffects": false` to this package. `src/monaco/workers.ts` and
 * `src/monaco/jsonc.ts` exist purely for their side effects; shaking them out
 * gives you an editor with no language workers and nothing in the console to
 * explain it.
 *
 * Those two are also deliberately NOT re-exported below. A barrel re-export
 * would pull Monaco into whatever chunk merely touched this file; they are
 * imported by the components that need them, so they land in the same chunk as
 * the editor itself.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS BARREL IS MONACO-ONLY, AND THAT IS LOAD-BEARING.
 *
 * The markdown half — MarkdownView, MarkdownExcerpt, and the renderer — is
 * reachable ONLY through subpaths:
 *
 *     import MarkdownView from '@ets/editor/components/MarkdownView';
 *     import { renderMarkdownToHtml } from '@ets/editor/markdown/render';
 *
 * SimpleMarkdownEditor is subpath-only for the same reason, and it is the more
 * expensive one: it carries Tiptap and therefore ProseMirror. Re-exporting it
 * here would put a rich-text engine in the chunk of anything that touches this
 * barrel to render a diff.
 *
 *     import SimpleMarkdownEditor from '@ets/editor/components/SimpleMarkdownEditor';
 *
 * (No `.vue` on the component specifier: the exports pattern is
 * `"./components/*": "./src/components/*.vue"`, so including it resolves to
 * `*.vue.vue`.)
 *
 * Re-exporting markdown here was measured and reverted. Rollup treats a barrel
 * as one module: anything reachable from it joins the chunk of whatever touches
 * it. config-admin's App.vue reaches DiffViewer eagerly, so a barrel carrying
 * markdown hoisted markdown-it + dompurify (~131KB) out of the lazy chunk they
 * belonged in and into the entry — for an app that renders markdown only on
 * detail screens.
 *
 * The rule, then: this barrel may only ever carry things that already travel
 * together. Anything with its own dependency gets a subpath.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { default as DiffViewer } from './components/DiffViewer.vue';
export { default as JsonEditor } from './components/JsonEditor.vue';
export { default as MarkdownEditor } from './components/MarkdownEditor.vue';
export { default as MergeEditor } from './components/MergeEditor.vue';
