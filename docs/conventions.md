# Code conventions

Rules for all code in the HomeOn monorepo. When existing code disagrees with this document, this
document wins and the code should be fixed.

## 1. Repository layout

```
config/schemas/     JSON schemas for every MQTT event (single source of truth)
scripts/            repo tooling (e.g. generateConfigFiles: schemas -> C++ / TS)
helpers/            helpers used by scripts
generated/          @home-on/generated - generated TS types (never edit by hand)
libs/<name>/        @home-on/<name> - shared TS packages (drizzle, logger, ...)
services/<name>/    deployable services (device-ingest, frontend, ...)
firmware/           PlatformIO project
  lib/<Name>/       reusable firmware libraries (Mqtt, WifiService, ...)
  devices/<id>/     one folder per physical device (main.cpp, config.h, discovery.h)
docs/               project documentation
```

- The monorepo uses pnpm workspaces. Internal packages are named `@home-on/<name>` and referenced
  as `workspace:*`.
- Code that two or more services need goes into `libs/`. Code used by a single service stays inside
  that service.

## 2. Event contracts (single source of truth)

- Every MQTT payload is defined in `config/schemas/*.json`. Nothing else may define the shape of
  an MQTT payload.
- A schema declares its topic prefix with `x-topic-prefix`.
- After **any** schema change, run `pnpm generate-configs`. It regenerates:
  - `firmware/lib/Mqtt/Events.h` (C++ structs)
  - `generated/events.ts` (TS types and `TOPIC_PREFIXES`)
- Generated files are **never edited by hand**. Commit them together with the schema change.
- Payloads are validated with zod at the boundary (`contract/validation.ts`) before any handler
  runs. Handlers can trust their typed payload.
- REST DTOs (what a service's HTTP API returns) live in that service's `contract/` folder, e.g.
  `services/device-ingest/contract/devices.ts`. Other packages (e.g. the frontend) import them
  from there.

## 3. MQTT

### Topic structure

```
home-on/v1/<event-type>/<device_id>[/<component_id>[/<command>]]
```

| Event     | Topic                                                    |
| --------- | -------------------------------------------------------- |
| discovery | `home-on/v1/discovery/<device_id>`                       |
| telemetry | `home-on/v1/telemetry/<device_id>/<component_id>`        |
| command   | `home-on/v1/commands/<device_id>/<component_id>/<command>` |

- The root segment `home-on` is kebab-case. `device_id`, `component_id` and command names are
  snake_case, the same as the IDs in the schemas.
- The version segment (`v1`) changes only on breaking contract changes, so old firmware keeps
  working on its old topics during a migration.
- Backend subscriptions support the `#` wildcard but not `+`.

### Delivery rules

| Event     | QoS | Retain | Why                                                                     |
| --------- | --- | ------ | ----------------------------------------------------------------------- |
| discovery | 0   | yes    | a restarted backend gets every device's last discovery event right away |
| telemetry | 0   | no     | a new reading follows shortly; a stale retained reading would mislead   |
| commands  | 1   | no     | must not be lost; retaining would replay the command on every reconnect |

- QoS 1 can deliver a message twice, so commands must be **idempotent**: send absolute states
  (`set ON`, `set 40%`), never relative ones (`toggle`, `+10%`).
- QoS 2 is not used (PubSubClient on the ESP does not support publishing with it).

## 4. TypeScript

### General

- ESM only (`"type": "module"`, `NodeNext` resolution). Relative imports include the `.js`
  extension.
- `strict` mode is on. Avoid `any`; when a value really is unknown, use `unknown` and narrow it
  (or validate it with zod).
- Formatting comes from Prettier (`.prettierrc`): no semicolons, single quotes, trailing commas,
  100-character lines. Don't format by hand; run Prettier.

### Style rules

- Use `type`, not `interface`:
  ```ts
  type Device = { id: string; name: string }
  ```
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

### Environment variables

- Shared variables (MQTT broker, etc.) go in the root `.env.shared`. Service-specific variables go
  in `services/<name>/.env`. Each has a committed `.env.example` that must be kept up to date.
- A service loads its envs in `src/envConfig.ts`, which must be the **first** import in `app.ts`.

## 5. Backend service structure

Each service is split into feature modules (e.g. `src/discovery/`). A module has these layers:

```
src/<module>/
  index.ts          wiring: Express router + MQTT listeners -> handlers
  handlers/         entry points: parse the request/event, call services, send the response
  services/         business logic (e.g. "upsert a discovered device and its components")
  repository/       all database access; returns DTOs, never raw rows
  mappers.ts        db row -> DTO conversions (toXxxDTO)
  types.ts          module-internal types and shared query shapes (e.g. FULL_DEVICE_WITH)
```

Rules:

- Calls only go downwards: `index` -> `handlers` -> `services` -> `repository` -> `db`.
- Handlers never import `db` or tables. Services never import from Express.
- Only repositories touch Drizzle. Anything they return to other layers is a DTO from
  `contract/`, built with a mapper.
- Nullable database columns become optional DTO fields (`null` -> `undefined`) inside mappers.
- Cross-cutting infrastructure (MQTT client, db instance, env config) lives at the service's
  `src/` root (`src/mqtt/`, `src/db/`), not inside feature modules.

### Database (Drizzle + Postgres)

- Table schemas live in `src/db/schema/<table>.ts`, one table per file, with relations in
  `src/db/relations/`.
- Define tables with `snakeCase.table(...)` from `@home-on/drizzle`. TS fields are camelCase;
  database tables and columns are snake_case.
- Every schema file exports the inferred row types:
  ```ts
  export type Device = typeof devices.$inferSelect
  export type NewDevice = typeof devices.$inferInsert
  ```
- Upserts use `onConflictDoUpdate` with `prepareUpdateOnConflictSet`, listing explicitly which
  columns may be updated.
- Writes that touch more than one table run in a transaction (`db.transaction`).
- Type relational query results with `QueryWith` / `QueryResult` from `src/db/types.ts`.

## 6. Comments and logging

- Exported functions, types and non-obvious schema columns get a short `/** ... */` comment.
- Inline comments explain **why**, not what:
  ```ts
  // drizzle rejects an insert with no values, and a device may report no components at all
  if (toSave.components.length) { ... }
  ```
- Mark known problems with `// fixme: <what and why>` so they can be found with grep.
- Never call `console.*` directly. Create a logger per module and give it a context tag:
  ```ts
  const logger = buildLogger('[MQTT]')
  logger.info(`Connected to ${host}`)
  ```

## 7. Firmware (C++ / PlatformIO)

- Formatting comes from `.clang-format` (Google style, 4-space indent). Run clang-format; don't
  format by hand.
- Naming follows the [Google C++ style guide](https://google.github.io/styleguide/cppguide.html#Naming):

  | Kind                         | Style              | Example                     |
  | ---------------------------- | ------------------ | --------------------------- |
  | types (class/struct/enum)    | PascalCase         | `MqttService`, `MqttConfig` |
  | functions and methods        | PascalCase         | `Connect()`, `Publish()`    |
  | variables, parameters, fields | snake_case        | `board_id`, `retry_time_ms` |
  | private class members        | snake_case + `_`   | `client_`                   |
  | constants                    | `k` + PascalCase   | `kTrigPin`, `kMqttHost`     |
  | namespaces                   | PascalCase         | `HomeOn`                    |

- Struct fields that mirror JSON schema keys are snake_case anyway, which keeps the generated
  `Events.h` consistent with hand-written code.
- All library code goes in `namespace HomeOn`.
- Libraries (`firmware/lib/`) never depend on a specific device. Each device's specifics (pins,
  IDs, discovery payload) stay in `firmware/devices/<device_id>/`.
- Secrets and environment values come from `firmware/.env` (via `scripts/get_env.py`) and are
  never hard-coded in `config.h`.

## 8. Frontend

TBD. These conventions will be defined when frontend work starts.
