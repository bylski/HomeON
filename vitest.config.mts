import { defineConfig } from 'vitest/config'

// .mts because the root package.json is CommonJS and Vitest is ESM-only
// projects are split by test layer (see docs/conventions/testing.md), so `--project unit` runs
// the fast tests of every package at once
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['{services,libs,scripts,helpers}/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/*.int.test.ts'],
        },
      },
    ],
  },
})
