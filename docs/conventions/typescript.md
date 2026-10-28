# TypeScript

## General

- ESM only (`"type": "module"`, `NodeNext` resolution). Relative imports include the `.js`
  extension.
- `strict` mode is on. Avoid `any`; when a value really is unknown, use `unknown` and narrow it
  (or validate it with zod).
- Formatting comes from Prettier (`.prettierrc`): no semicolons, single quotes, trailing commas,
  100-character lines. Don't format by hand; run Prettier.

## Style rules

- Use `type`, not `interface`:
  ```ts
  type Device = { id: string; name: string }
  ```
  Exception: generated code (`generated/events.ts`) keeps the `interface`s that
  json-schema-to-typescript produces. It's never edited by hand and is excluded from ESLint.
- Use `import type { ... }` for imports that are only types.
- Use arrow functions, not function declarations:
  ```ts
  export const getDevices = async (req: Request, res: Response) => { ... }
  ```
- File names are camelCase (`handleDiscovery.ts`, `metricsMetadata.ts`). Folder names are
  lowercase.
- Identifiers: camelCase for variables and functions, PascalCase for types, SCREAMING_SNAKE_CASE
  for module-level constants (`FULL_DEVICE_WITH`, `TOPIC_PREFIXES`).
- Both named and default exports are allowed.
- Use `satisfies` to type-check constant objects without widening them
  (`as const satisfies QueryWith<'devices'>`).

## Environment variables

- Shared variables (MQTT broker, etc.) go in the root `.env.shared`. Service-specific variables go
  in `services/<name>/.env`. Each has a committed `.env.example` that must be kept up to date.
- A service loads its envs in `src/envConfig.ts`, which must be the **first** import in the entry file (`src/main.ts`).
