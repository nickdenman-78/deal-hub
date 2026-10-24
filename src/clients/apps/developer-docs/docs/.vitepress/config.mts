import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import type { PluginWithParams } from 'markdown-it';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import { withMermaid } from 'vitepress-plugin-mermaid';
import container from 'markdown-it-container';
import withDrawio from '@dhlx/vitepress-plugin-drawio';
import { siteDescription, nav, sidebar, footer } from '../config';

// Helper to create a container with optional title
function createContainer(type: string): [PluginWithParams] {
  return [
    container,
    type,
    {
      render(
        tokens: {
          [x: string]: {
            nesting: number;
            info: string;
            markup: string;
          };
        },
        idx: string | number,
      ) {
        const token = tokens[idx];
        if (token.nesting === 1) {
          // Extract optional title text
          const info = token.info.trim().slice(type.length).trim();
          let titleHtml = '';
          if (info) {
            titleHtml = `<div class="custom-title">${tokens[idx].markup === ':::' ? info : ''}</div>\n`;
          }
          return `<div class="custom-block ${type}">\n${titleHtml}`;
        } else {
          return '</div>\n';
        }
      },
    },
  ] as unknown as [PluginWithParams];
}

// https://vitepress.dev/reference/site-config
export default withDrawio(
  withMermaid(
    defineConfig({
      title: 'ETS',
      description: siteDescription,
      lang: 'en-AU',

      cleanUrls: true,
      metaChunk: true,
      lastUpdated: true,

      // Favicons are copies of @ets/brand assets (see packages/brand README).
      head: [
        ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
        ['link', { rel: 'icon', href: '/favicon.png', type: 'image/png', sizes: '32x32' }],
        ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
        // Web fonts used by the theme.
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
        [
          'link',
          {
            href:
              'https://fonts.googleapis.com/css2' +
              '?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400' +
              '&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700' +
              '&display=swap',
            rel: 'stylesheet',
          },
        ],
      ],

      ignoreDeadLinks: [/^http:\/\/localhost/],

      themeConfig: {
        nav,
        sidebar,
        footer,
        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'full',
            timeStyle: 'short',
            hour12: true,
          },
        },
        search: {
          provider: 'local',
        },
      },
      markdown: {
        math: true,
        // Shiki ships PowerShell as `powershell` (aliases ps, ps1); the docs fence it as `pwsh`.
        languageAlias: { pwsh: 'powershell' },
        toc: {},
        config(md) {
          md.use(groupIconMdPlugin);
          // Register multiple types
          md.use(...createContainer('danger'));
          md.use(...createContainer('info'));
          md.use(...createContainer('warning'));
          md.use(...createContainer('success'));
          md.use(...createContainer('tip'));
        },
      },
      mermaid: {
        // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
      },
      vite: {
        build: {
          // The app bundle, the local search index and Mermaid's diagram modules each exceed
          // Vite's 500 kB default by design; warn only when something grows well past them.
          chunkSizeWarningLimit: 1000,
        },
        resolve: {
          alias: [
            {
              find: /^dayjs$/,
              replacement: fileURLToPath(new URL('./shims/dayjs-default.mjs', import.meta.url)),
            },
            {
              find: /^@braintree\/sanitize-url$/,
              replacement: fileURLToPath(new URL('./shims/sanitize-url.mjs', import.meta.url)),
            },
          ],
        },
        optimizeDeps: {
          // Keep this minimal. Only include things you actually import that need prebundling.
          // If you previously added these, remove them to stop the "Failed to resolve dependency" warnings:
          include: ['mermaid', 'dayjs', '@braintree/sanitize-url'],
          exclude: ['dayjs/dayjs.min.js'], // ensure the UMD build is never scanned
        },
        ssr: {
          // Helps in VitePress SSR so it doesn’t externalize the wrong variant
          noExternal: ['mermaid', 'dayjs', '@braintree/sanitize-url'],
        },
        plugins: [
          groupIconVitePlugin({
            customIcon: {
              shell: 'vscode-icons:file-type-shell',
              terminal: 'vscode-icons:file-type-shell',
            },
          }),
        ],
      },
    }),
  ),
  {
    width: '100%',
    darkMode: 'auto',
    transparent: true,
  },
);
