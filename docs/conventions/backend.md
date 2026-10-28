# Backend services

## Module layout

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

## Layer rules

- Calls only go downwards, one layer at a time: `index` -> `handlers` -> `services` ->
  `repository` -> `db`. **No layer is skipped**: a handler always calls a service, even when the
  service only passes the call through (`getAllDevices = () => getAllFullDevices()`). Every module
  then has the same shape, and new logic always has an obvious home.
- Handlers never import repositories, `db` or Drizzle. Services never import Express, handlers, or
  the `db` instance; they may import db schema **types** (`NewDevice`) to build rows.
- Only repositories touch Drizzle. Anything they return to other layers is a DTO from
  `contract/`, built with a mapper. Repositories never import handlers, services or Express.
- These import rules are enforced by ESLint (see [tooling.md](tooling.md)).
- Nullable database columns become optional DTO fields (`null` -> `undefined`) inside mappers.
- Cross-cutting infrastructure (MQTT client, db instance, env config) lives at the service's
  `src/` root (`src/mqtt/`, `src/db/`), not inside feature modules.

## Entry point

A service starts in three steps, split so tests can use each one on its own:

- `src/main.ts`: loads envs and calls `start()`. Nothing else imports it.
- `src/server.ts`: `start(port)` connects MQTT, registers listeners, starts HTTP and returns
  `stop()`.
- `src/app.ts`: `createApp()` builds the Express app without side effects.

## Database (Drizzle + Postgres)

- Schema changes go through migrations: after changing `src/db/schema/`, run `pnpm db:generate`
  and commit the new folder in `drizzle/`. Never edit a committed migration; add a new one.
  `pnpm db:migrate` applies pending migrations.

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
