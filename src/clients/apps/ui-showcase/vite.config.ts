import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// Dev harness only — never deployed, so there is no `base` and no proxy.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // Linked workspace packages ship raw .ts/.vue/.css through their exports
    // map, so esbuild's prebundler must not try to process them. Vite excludes
    // linked deps by default but still scans them; being explicit stops a
    // scanner regression surfacing as an opaque esbuild parse error.
    exclude: ['@ets/brand', '@ets/ui', '@ets/editor'],
    // ...and their runtime dependencies must be listed here, because Vite's
    // dependency scanner does not crawl into excluded packages. Without this,
    // the first import of a @ets/ui component triggers late discovery and a
    // full page reload mid-session.
    //
    // NOTE THE `owner > dep` FORM. Vite resolves a bare name from the APP root,
    // and under pnpm's isolated layout a workspace package's own dependencies
    // are not there. Bare names fail with "Failed to resolve dependency: X,
    // present in client 'optimizeDeps.include'" — a startup line that is easy
    // to scroll past — and the dep is then discovered late anyway, reloading
    // the page. `@iconify/vue` is exempt only because this app declares it
    // itself; the editor's three do not.
    //
    // `monaco-editor` IS listed here, unlike in config-admin, and the
    // difference is the point. config-admin imports Monaco from its own source,
    // so the scanner finds it during the initial crawl; nothing in this app's
    // source does, so it was discovered only when the editors route was first
    // requested. Vite then re-optimized and reloaded mid-flight, and editors
    // caught by that reload threw "Cannot set tokens provider for unknown
    // language json" — an error that reads like a dual-instance problem and is
    // not one. Its own `?worker` deep imports are unaffected: Vite compiles
    // those separately either way.
    include: [
      '@vuetify/v0',
      '@vuetify/v0/components',
      '@iconify/vue',
      '@ets/ui > cronstrue',
      '@ets/ui > croner',
      '@ets/editor > monaco-editor',
      '@ets/editor > @tiptap/core',
      '@ets/editor > @tiptap/vue-3',
      // A SEPARATE entry from the one above. Vite prebundles per entry point,
      // and the bubble/floating menus are a distinct subpath — omitting it left
      // them to late discovery on the first selection, which reloads the page
      // and takes the editor's unsaved content with it.
      '@ets/editor > @tiptap/vue-3/menus',
      '@ets/editor > @tiptap/starter-kit',
      '@ets/editor > @tiptap/extension-link',
      '@ets/editor > @tiptap/extensions',
      // NOT '@tiptap/pm': it is a namespace package with subpath exports only
      // and no "." entry, so naming it here fails the dev server outright with
      // 'Missing "." specifier'. Its subpaths arrive through the packages above.
      '@ets/editor > markdown-it',
      '@ets/editor > dompurify',
      '@ets/editor > node-diff3',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
  server: {
    // 5300 is the ETS SPA. 5303 keeps both runnable side by side.
    port: 5303,
  },
});
