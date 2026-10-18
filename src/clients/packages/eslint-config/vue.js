import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';

import base from './index.js';

/**
 * Vue 3 + TypeScript SFCs.
 *
 * `vue-eslint-parser` must own .vue files and delegate <script lang="ts"> to the
 * TypeScript parser — the reverse does not work, because the TS parser cannot
 * read SFC blocks.
 */
export default [
  ...base,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // The house style is multi-word component names only where they read
      // naturally; view components are named after their route.
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    /**
     * The frontend counterpart of the ETS architecture tests: modules in the
     * ETS SPA (deals, settlement, risk, …) must not reach into each other.
     * Cross-module contracts go through the API layer, mirroring the backend
     * rule that IntegrationEvents is a module's only public surface (ADR-0004).
     */
    files: ['**/apps/ets/src/modules/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/*', '../*/!(routes)'],
              message:
                'Modules must not import each other. Cross-module contracts go through the API layer — see ADR-0004.',
            },
          ],
        },
      ],
    },
  },
  // MUST stay last: switches off every rule that overlaps Prettier. Without it,
  // eslint-plugin-vue's formatting rules (max-attributes-per-line, html-indent,
  // singleline-html-element-content-newline and friends) fight Prettier over
  // roughly 1,200 findings in the config SPA alone, and whichever tool ran last
  // wins. Formatting is Prettier's job; ESLint's is correctness.
  prettier,
];
