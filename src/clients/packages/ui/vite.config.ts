import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// @ets/ui has no build — apps consume its raw .vue/.ts through the exports
// map. This config exists solely so vitest can compile SFCs for component
// tests; there is no `build` section on purpose.
//
// `attachTo: document.body` in the blade tests needs a real document, hence
// jsdom. Note jsdom has no layout engine: anything depending on measured
// geometry (the blade strip's auto-scroll, the mobile collapse) cannot be
// asserted here and is verified in the sandbox instead.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Polyfills <dialog>.showModal and the Popover API, neither of which jsdom
    // implements — and whose absence surfaces as errors from inside v0 rather
    // than as anything recognisable. See the file for the exact gaps.
    setupFiles: ['./test/setup.ts'],
  },
});
