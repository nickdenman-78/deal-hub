import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, __dirname, ''), ...process.env };
  const api = env.ETS_API ?? 'https://localhost:7201';

  return {
    plugins: [vue()],
    base: '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    optimizeDeps: {
      // Linked workspace packages ship raw .ts/.css through their exports map,
      // so esbuild's prebundler must not process them...
      exclude: ['@ets/brand', '@ets/ui'],
      // ...and their runtime dependencies must be listed, because Vite's scanner
      // does not crawl excluded packages. The `owner > dep` form is required:
      // under pnpm's isolated layout a workspace package's own dependencies are
      // not resolvable from the app root. See src/clients/CONTEXT.md.
      include: [
        '@vuetify/v0',
        '@vuetify/v0/components',
        '@ets/ui > @iconify/vue',
        '@ets/ui > cronstrue',
        '@ets/ui > croner',
      ],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
    },
    server: {
      // Fixed so it matches the redirect URIs registered on the Keycloak
      // "ets-web" client in src/aspire/Ets.Aspire.AppHost/Realms/ets-realm.json.
      port: 5300,
      strictPort: true,
      proxy: {
        // Same-origin /api in dev, so the API needs no CORS entry for Vite.
        // `secure: false` because Node does not read the OS certificate store, so it cannot verify the ASP.NET Core
        // developer certificate the API serves locally. Dev server only; nothing here ships.
        '/api': { target: api, changeOrigin: true, ws: true, secure: false },
      },
    },
    test: {
      environment: 'jsdom',
    },
  };
});
