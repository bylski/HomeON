# Tooling

The conventions in this folder are enforced by tools wherever a tool can check them. When a
convention changes, update the matching rule too (and the other way around).

## Commands

| Command              | What it does                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `pnpm lint`          | ESLint, `prettier --check`, clang-format check and typecheck of everything    |
| `pnpm format`        | auto-fix: `eslint --fix`, `prettier --write`, `clang-format -i`               |
| `pnpm typecheck`     | `tsc --noEmit` for the root (scripts, helpers) and every package              |
| `pnpm check:codegen` | regenerates event types and fails if they differ from the working tree        |
| `pnpm test`          | the fast tests; `test:integration`, `test:all` (see [testing.md](testing.md)) |

## What checks what

| Convention                                          | Checked by                                           |
| --------------------------------------------------- | ---------------------------------------------------- |
| TS / JSON / Markdown formatting                     | Prettier (`.prettierrc`)                             |
| C++ formatting                                      | clang-format (`.clang-format`), `scripts/lintCpp.ts` |
| `type` over `interface`, `import type`              | ESLint (typescript-eslint)                           |
| arrow functions, no `console`, no `any`             | ESLint                                               |
| identifier naming, camelCase file names             | ESLint (`naming-convention`, `check-file`)           |
| backend layers (handlers -> services -> repository) | ESLint `no-restricted-imports` per folder            |
| strict types, `.js` import extensions               | `tsc` (NodeNext resolution)                          |
| generated files match the schemas                   | `scripts/checkCodegen.ts`                            |
| LF line endings                                     | `.gitattributes` + Prettier                          |

Not checked automatically (documented conventions only): C++ naming (Google style), comment style,
MQTT topic structure and delivery rules, and frontend conventions (TBD).

## Where checks run

- **Pre-commit hook** (husky, `.husky/pre-commit`): lint-staged (`.lintstagedrc.mjs`) runs ESLint,
  Prettier and clang-format on staged files, the unit and contract tests related to staged TS
  files, plus the codegen check when a schema or generated file is staged. Then `pnpm typecheck`
  runs. A failing check blocks the commit.
- **CI** (`.github/workflows/ci.yml`): every check and test layer on pull requests and pushes to
  `master` (see [testing.md](testing.md)). CI installs clang-format 22, the version used locally;
  keep them on the same major version, since formatting rules change between versions.
- **pnpm** is pinned with `packageManager` in the root `package.json`, so local installs, CI and
  the Docker build (corepack) use the same version.
- **Claude Code hook** (`.claude/settings.json` -> `scripts/claudeLintHook.ts`): after every file
  Claude edits, it auto-fixes and formats the file and reports remaining ESLint errors back to
  Claude, so AI-written code is fixed right away.

## Setup notes

- ESLint lives in `libs/eslint-config` (`@home-on/eslint-config`), re-exported by the root
  `eslint.config.mjs`. That package pins **TypeScript 6**: typescript-eslint does not support
  TypeScript 7 (the native compiler has no JS API), while the rest of the repo compiles with
  TS 7. Revisit when typescript-eslint supports TS 7.
- The root config is `.mjs` because the root `package.json` is not `"type": "module"` (the
  codegen scripts rely on CommonJS `__dirname`).
- Generated files (`generated/`) and compiled `libs/*/index.js` are excluded from ESLint.
