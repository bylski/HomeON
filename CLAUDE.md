# HomeOn

A home-automation platform: ESP microcontrollers (PlatformIO firmware) talk over MQTT to TypeScript
microservices running in Docker Compose on a Raspberry Pi. Data is stored in Postgres and shown in
a React frontend.

Project goals are in [docs/goals.md](docs/goals.md) and the system overview is in
[docs/architecture.md](docs/architecture.md).

Read [docs/conventions.md](docs/conventions.md) before writing code. The key rules:

- **Contracts:** MQTT payloads are defined only in `config/schemas/*.json`. After any change run
  `pnpm generate-configs`. Never edit `generated/events.ts` or `firmware/lib/Mqtt/Events.h` by hand.
- **Topics:** `home-on/v1/<event-type>/<device_id>[/<component_id>[/<command>]]`. Discovery is
  retained, telemetry uses QoS 0, commands use QoS 1 and must be idempotent.
- **Backend layers:** `index` -> `handlers` -> `services` -> `repository` -> `db`. Only
  repositories use Drizzle, and they return DTOs from `contract/` via mappers.
- **TypeScript:** ESM with `.js` import extensions, `type` instead of `interface`, arrow
  functions, camelCase file names, Prettier formatting. Log through `buildLogger('[Ctx]')`, never
  `console.*`.
- **C++:** Google style (`.clang-format`). PascalCase types and functions, snake_case variables,
  `member_` suffix for private members, `kConstant`, everything in `namespace HomeOn`.
- **Comments** explain why, not what. Mark known issues with `// fixme:`.

## Commands

- `pnpm generate-configs`: regenerate C++ and TS event types from the JSON schemas
- `pnpm upload <env>`: build and flash firmware for a PlatformIO env
- `services/device-ingest`: `pnpm dev` (watch mode) / `pnpm build` / `pnpm start`
