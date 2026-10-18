import { defineConfig } from 'vitest/config';

// No Vue, no jsdom — brand is CSS only. These tests are string guards on
// tokens.css (see tokens.test.ts).
export default defineConfig({
  test: {
    environment: 'node',
  },
});
