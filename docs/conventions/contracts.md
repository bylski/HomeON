# Event contracts

- Every MQTT payload is defined in `config/schemas/*.json`. Nothing else may define the shape of
  an MQTT payload.
- A schema declares its topic prefix with `x-topic-prefix`.
- After **any** schema change, run `pnpm generate-configs`. It regenerates:
  - `firmware/lib/Mqtt/Events.h` (C++ structs)
  - `generated/events.ts` (TS types and `TOPIC_PREFIXES`)
- Generated files are **never edited by hand**. Commit them together with the schema change.
- Payloads are validated with zod at the boundary (`contract/validation.ts`) before any handler
  runs. Handlers can trust their typed payload.
- The zod schemas (`src/schemas/events.ts`) are written by hand, not generated. Each is typed as
  `z.ZodType<GeneratedType>` so the compiler catches most drift. Any drift it misses shows up as
  validation failures in handlers, and is fixed there for now.
- REST DTOs (what a service's HTTP API returns) live in that service's `contract/` folder, e.g.
  `services/device-ingest/contract/devices.ts`. Other packages (e.g. the frontend) import them
  from there.
