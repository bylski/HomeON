# Testing

## Test layers

| Layer       | What's real                                    | What's faked                             | Example                                                        |
| ----------- | ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| unit        | one function or module                         | everything below it (`vi.mock`)          | a service maps a discovery event to rows, repository mocked    |
| contract    | JSON schemas, Zod schemas, C++ JSON converters | everything else                          | a C++ `DeviceDiscoveryEvent` serializes to JSON Zod accepts    |
| integration | one service + real Postgres and Mosquitto      | devices, other services, frontend        | a retained discovery event ends up in `GET /discovery/devices` |
| e2e         | the whole compose stack, built images          | ESP devices (replaced by virtual device) | a virtual device announces itself and appears within 5 s       |
| firmware    | plain C++ logic from `firmware/lib/`           | nothing (Arduino code isn't compiled)    | topic building, a device payload matches its golden file       |

## Tools

| Purpose                          | Tool                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| TS test runner                   | Vitest, configured once in the root `vitest.config.mts`    |
| Postgres / MQTT in tests         | Testcontainers (`postgres`, `eclipse-mosquitto` images)    |
| JSON schema validation           | ajv (contract tests)                                       |
| E2E stack                        | Docker Compose with a `compose.e2e.yml` override           |
| C++ tests                        | GoogleTest in the PlatformIO `native` env (runs on the PC) |
| browser tests (when UI has data) | Playwright                                                 |

Integration and e2e tests need Docker Desktop running. Unit, contract and firmware tests need
nothing.

## Where test files go

- **Unit tests** sit next to the file they test, named `<file>.test.ts`:
  `src/mqtt/helpers.ts` -> `src/mqtt/helpers.test.ts`.
- **Integration tests** live in `services/<svc>/tests/integration/` and are named
  `<feature>.int.test.ts`, so slow tests are obvious from the path. Shared setup (containers,
  migrations) goes in `services/<svc>/tests/setup/`.
- **Contract tests and fixtures** live in `tests/contract/` at the repo root, since they cover both
  firmware and services.
- **E2E tests** live in `e2e/` at the repo root, since they cover the whole system.
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
- `tests/contract/golden/<event>/` holds JSON written by the firmware's real serialization code.
  Both validators must accept it.
- A new schema in `config/schemas/` fails the run until it is added to the test.

## Firmware tests

- `pnpm test:firmware` builds the tests in `firmware/test/` for the PC (PlatformIO `native` env,
  GoogleTest) and runs them. No board is needed.
- Only Arduino-free code can be tested: the `Events` library (generated structs, JSON converters,
  `ToJson`, `BuildTopic`). Logic worth testing goes there as plain C++ (`std::string`), and the
  Arduino-specific code (`Serial`, pins, WiFi, `PubSubClient`) stays a thin layer that calls it.
- Golden tests serialize real device payloads (e.g. `devices/test_sensors/discovery.h`) and
  compare them with `tests/contract/golden/`. When a payload changes on purpose, run
  `pnpm test:firmware:update` and commit the updated golden files; the contract tests then check
  the new output against the schemas.

## Commands

| Command                     | What it runs                                |
| --------------------------- | ------------------------------------------- |
| `pnpm test`                 | the fast tests (no Docker needed)           |
| `pnpm test:unit`            | only the unit tests                         |
| `pnpm test:integration`     | integration tests (needs Docker Desktop)    |
| `pnpm test:all`             | every Vitest project                        |
| `pnpm test:firmware`        | firmware tests on the PC (needs PlatformIO) |
| `pnpm test:firmware:update` | firmware tests, rewriting the golden files  |
| `pnpm test:watch`           | Vitest in watch mode                        |

## Where tests run

- **Pre-commit hook:** planned: unit tests related to the staged files (`vitest related`).
- **CI (GitHub Actions):** planned: every layer, one job per layer.
- **Claude Code hook:** lint only, no tests.
