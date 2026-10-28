# Testing

## Test layers

| Layer       | What's real                                    | What's faked                             | Example                                                        |
| ----------- | ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| unit        | one function or module                         | everything below it (`vi.mock`)          | a service maps a discovery event to rows, repository mocked    |
| contract    | JSON schemas, Zod schemas, C++ JSON converters | everything else                          | a C++ `DeviceDiscoveryEvent` serializes to JSON Zod accepts    |
| integration | one service + real Postgres and Mosquitto      | devices, other services, frontend        | a retained discovery event ends up in `GET /discovery/devices` |
| system      | the shipped compose stack (built images)       | ESP devices (replaced by virtual device) | the image starts and a device is listed within 5 s             |
| firmware    | plain C++ logic from `firmware/lib/`           | nothing (Arduino code isn't compiled)    | topic building, a device payload matches its snapshot          |
| e2e         | everything, from device to browser             | ESP devices (replaced by virtual device) | planned with the UI: a reading appears on the dashboard        |

**Integration vs system:** both cover one service with its infrastructure. Integration tests run
the service code in-process and test its behaviour in detail. System tests run what is deployed
(Docker images, compose config, migrations in the container) as a black box, and only check what
integration tests can't: that the shipped stack works, and requirements measured on it (latency).
A behaviour test belongs in integration. **E2E** is reserved for flows that end where the user
sees them, so it starts with the frontend.

## Tools

| Purpose                          | Tool                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| TS test runner                   | Vitest, configured once in the root `vitest.config.mts`    |
| Postgres / MQTT in tests         | Testcontainers (`postgres`, `eclipse-mosquitto` images)    |
| JSON schema validation           | ajv (contract tests)                                       |
| system test stack                | Docker Compose with a `compose.system.yml` override        |
| C++ tests                        | GoogleTest in the PlatformIO `native` env (runs on the PC) |
| browser tests (when UI has data) | Playwright                                                 |

Integration and system tests need Docker Desktop running. Unit, contract and firmware tests need
nothing.

## Where test files go

- **Unit tests** sit next to the file they test, named `<file>.test.ts`:
  `src/mqtt/helpers.ts` -> `src/mqtt/helpers.test.ts`.
- **Integration tests** live in `services/<svc>/tests/integration/` and are named
  `<feature>.int.test.ts`, so slow tests are obvious from the path. Shared setup (containers,
  migrations) goes in `services/<svc>/tests/setup/`.
- **Contract tests and fixtures** live in `tests/contract/` at the repo root, since they cover both
  firmware and services.
- **System tests** live in `tests/system/` and are named `<area>.system.test.ts`.
- **E2E tests** will live in `e2e/` at the repo root.
- **Firmware tests** live in `firmware/test/`.

## Writing tests

- Test behaviour through a module's exported functions, not its internals. A non-exported helper
  is tested through the function that uses it.
- A unit test mocks only the layer **directly below** the one under test (a service test mocks the
  repository, a handler test mocks the service). Mock with a factory,
  `vi.mock('../repository/devices.js', () => ({ ... }))`, so the real module and its imports (db,
  MQTT client) are never loaded.
- The backend layer import rules don't apply to test files, so a test can import the mocked module
  to check its calls.
- Build payloads with the generated types (`DeviceDiscoveryEvent`, ...) so a schema change breaks
  the tests at compile time instead of silently.
- Name tests after the behaviour, not the function: `'keeps metrics of every component'`, not
  `'test extractDiscoveryDataToSave'`.

## Integration tests

- `tests/setup/globalSetup.ts` starts Postgres and Mosquitto containers once per run, applies the
  migrations and passes their addresses to the tests (`inject('testEnv')`).
- `tests/setup/testEnv.ts` copies those addresses into `process.env` before any `src` module is
  imported, and truncates every table before each test, so every test starts from an empty
  database.
- A test starts the real service with `start(0)` (a free port) and talks to it the way devices and
  the frontend do: it publishes over MQTT and reads results over REST.
- MQTT is asynchronous, so wait for results by polling with `vi.waitFor`, never with fixed sleeps.
- Retained messages survive between tests on the broker. Clear every retained topic a test
  publishes (publish an empty retained payload) in `afterEach`.
- Test files run one at a time because they share the database and broker.

## Contract tests

- `tests/contract/events.test.ts` checks every payload in `tests/contract/fixtures/<event>/` against
  the JSON schema (ajv) and the backend Zod schema. Files in `valid/` must be accepted by both,
  files in `invalid/` rejected by both. Name an invalid fixture after what is wrong with it
  (`negativeTimestamp.json`).
- `tests/contract/snapshots/<event>/` holds JSON written by the firmware's real serialization code.
  Both validators must accept it.
- A new schema in `config/schemas/` fails the run until it is added to the test.

## Firmware tests

- `pnpm test:firmware` builds the tests in `firmware/test/` for the PC (PlatformIO `native` env,
  GoogleTest) and runs them. No board is needed.
- Only Arduino-free code can be tested: the `Events` library (generated structs, JSON converters,
  `ToJson`, `BuildTopic`). Logic worth testing goes there as plain C++ (`std::string`), and the
  Arduino-specific code (`Serial`, pins, WiFi, `PubSubClient`) stays a thin layer that calls it.
- Snapshot tests serialize real device payloads (e.g. `devices/test_sensors/discovery.h`) and
  compare them with `tests/contract/snapshots/`. When a payload changes on purpose, run
  `pnpm test:firmware:update` and commit the updated snapshots; the contract tests then check
  the new output against the schemas.

## System tests

- `tests/system/setup/globalSetup.ts` builds the real images and starts `compose.yml` +
  `compose.system.yml` (Postgres, Mosquitto, test credentials) as the `homeon-system` project, on
  host ports 13000 (API) and 11883 (broker), so it can run next to the dev stack. It is removed
  after the run; set `SYSTEM_KEEP_STACK=1` to keep it for debugging.
- Keep them few: a system test that only checks service behaviour duplicates an integration test.
- Devices are replaced by the **virtual device** (`libs/virtual-device`), which publishes the same
  topics, delivery rules and payloads as the firmware. Its default discovery payload is the
  firmware's snapshot, so it sends exactly what `test_sensors` sends.
- Every test uses a fresh device id and removes its retained announcement afterwards
  (`device.forget()`), because the stack is shared by the whole run.
- Requirements from [docs/goals.md](../goals.md) are tested here, e.g. a device must be listed
  within 5 s of announcing itself.

## Virtual device

`pnpm virtual-device [--broker mqtt://localhost:1883] [--device-id virtual_sensors]
[--interval 1000] [--username u --password p]` fakes an ESP during development: it announces
itself, sends random readings within each metric's range, and logs the commands it receives.

## Commands

| Command                     | What it runs                                          |
| --------------------------- | ----------------------------------------------------- |
| `pnpm test`                 | the fast tests (no Docker needed)                     |
| `pnpm test:unit`            | only the unit tests                                   |
| `pnpm test:integration`     | integration tests (needs Docker Desktop)              |
| `pnpm test:all`             | every Vitest project                                  |
| `pnpm test:firmware`        | firmware tests on the PC (needs PlatformIO)           |
| `pnpm test:firmware:update` | firmware tests, rewriting the snapshots               |
| `pnpm test:system`          | system tests against the shipped stack (needs Docker) |
| `pnpm virtual-device`       | a fake ESP device for development                     |
| `pnpm test:watch`           | Vitest in watch mode                                  |

## Where tests run

- **Pre-commit hook:** the unit and contract tests that import a staged file (`vitest related`).
- **CI (GitHub Actions, `.github/workflows/ci.yml`):** on every pull request and push to
  `master`, one job per layer: lint + codegen check, unit + contract, firmware (native tests and
  the real `test_sensors` build), integration, system.
- **Claude Code hook:** lint only, no tests.
- Not checked yet: an ARM image build for the Raspberry Pi. Add a `docker buildx` job for
  `linux/arm64` or `linux/arm/v7` once the Pi's OS (64- or 32-bit) is known.
