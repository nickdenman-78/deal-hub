import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Base flat config: plain TypeScript, no framework.
 *
 * This is the repository's first ESLint config. `pnpm lint` has been declared in
 * the admin SPA since it was written, but no config file existed anywhere, so it
 * has never actually run — expect findings on first use and triage them rather
 * than mass-fixing.
 */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.vitepress/cache/**',
      '**/.vitepress/dist/**',
      // Generated from the .NET contracts assembly by `pnpm generate-api`.
      // Editing it by hand is already a mistake; linting it is just noise.
      '**/src/api/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2022 },
    },
  },
];
