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
      {
        test: {
          name: 'contract',
          include: ['tests/contract/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration:device-ingest',
          root: 'services/device-ingest',
          include: ['tests/integration/**/*.int.test.ts'],
          globalSetup: ['tests/setup/globalSetup.ts'],
          setupFiles: ['tests/setup/testEnv.ts'],
          // all files share one database and broker, so they must not run at the same time
          fileParallelism: false,
          testTimeout: 15_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
})
