import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// @ets/editor has no build — apps consume its raw .vue/.ts through the
// exports map, exactly like @ets/ui. This config exists solely so vitest can
// compile SFCs; there is no `build` section on purpose.
//
// NOTE ON COVERAGE: the Monaco components here are deliberately NOT unit-tested.
// Monaco measures its container to lay out, and jsdom has no layout engine — a
// mounted editor reports zero height and never renders a line, so a test would
// either assert nothing useful or be flaky. They are verified in
// apps/ui-showcase against a real browser instead. The markdown renderer IS
// tested, because it is pure string-to-string and its DOMPurify allow-list is a
// security boundary.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Stubs the layout APIs ProseMirror calls when the caret moves. See the
    // file — without it a passing suite still fails, on an unhandled error.
    setupFiles: ['./test/setup.ts'],
    // An empty run is a legitimate state here, unlike in @ets/ui: most of
    // this package is Monaco components that cannot be meaningfully tested in
    // jsdom (see above), so `vitest run` finding nothing is not evidence of a
    // broken glob. Without this the workspace-wide `pnpm test` fails on exit
    // code 1 for a package that is behaving correctly.
    passWithNoTests: true,
  },
});
