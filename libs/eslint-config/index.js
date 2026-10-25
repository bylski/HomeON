import js from '@eslint/js'
import checkFile from 'eslint-plugin-check-file'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// rules map 1:1 to docs/conventions - keep both in sync when changing either

const DB_IMPORTS = ['**/db', '**/db/**', 'drizzle-orm', 'drizzle-orm/*', '@home-on/drizzle']
const EXPRESS_IMPORTS = ['express']

/** builds a no-restricted-imports rule banning given import patterns with one explanation */
const banImports = (patterns, message, { allowTypeImports = false } = {}) => [
  'error',
  {
    patterns: [
      {
        group: patterns,
        message: `${message} (see docs/conventions/backend.md)`,
        allowTypeImports,
      },
    ],
  },
]

export default defineConfig([
  globalIgnores([
    '**/node_modules',
    '**/dist',
    '**/.pio',
    'generated/**', // generated from config/schemas - never edited by hand
    'libs/*/index.js', // compiled output of index.ts
  ]),

  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    plugins: { 'check-file': checkFile },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'no-console': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        // PascalCase allowed for zod schemas and React components, UPPER_CASE for constants
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        // object keys mirror external formats (MQTT topics, snake_case schema keys, db columns)
        { selector: ['objectLiteralProperty', 'typeProperty'], format: null },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx,js,mjs}': 'CAMEL_CASE' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },

  // the logger itself and repo tooling print directly
  {
    files: ['libs/logger/**', 'scripts/**', 'helpers/**'],
    rules: { 'no-console': 'off' },
  },

  // backend layers: index -> handlers -> services -> repository -> db, no skipping
  {
    files: ['services/*/src/*/handlers/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': banImports(
        [...DB_IMPORTS, '**/repository', '**/repository/**'],
        'Handlers may only call services, never repositories or the db',
      ),
    },
  },
  {
    files: ['services/*/src/*/services/**'],
    rules: {
      // services build rows typed by db schema types, but never query the db themselves
      '@typescript-eslint/no-restricted-imports': banImports(
        [...DB_IMPORTS, ...EXPRESS_IMPORTS, '**/handlers/**'],
        'Services contain business logic only: no Express, no db access, no handlers',
        { allowTypeImports: true },
      ),
    },
  },
  {
    files: ['services/*/src/*/repository/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': banImports(
        [...EXPRESS_IMPORTS, '**/handlers/**', '**/services/**'],
        'Repositories never import upward (handlers, services) or Express',
      ),
    },
  },

  // frontend: conventions are TBD, keep the Vite scaffold rules and skip file naming for now
  {
    files: ['services/frontend/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: { 'check-file/filename-naming-convention': 'off' },
  },
])
