# Testing

This file holds the decisions and rules. How each piece is wired up is documented in the code
itself; start from `vitest.config.mts` and the `test*` scripts in `package.json`.

## Test layers

| Layer       | What's real                                | What's faked                           | Example                                             | Run with                |
| ----------- | ------------------------------------------ | -------------------------------------- | --------------------------------------------------- | ----------------------- |
| unit        | one function or module                     | the layer below it                     | a service maps an event to rows, repository mocked  | `pnpm test`             |
| contract    | JSON schemas, Zod schemas, firmware output | everything else                        | both validators accept what the firmware sends      | `pnpm test`             |
| firmware    | plain C++ logic from `firmware/lib/`       | nothing (Arduino code isn't compiled)  | a device's payload matches its snapshot             | `pnpm test:firmware`    |
| integration | one service + real database and broker     | devices, other services, frontend      | a discovery event ends up in the REST API           | `pnpm test:integration` |
| system      | the shipped compose stack (built images)   | devices (replaced by a virtual device) | the stack starts and meets the latency requirement  | `pnpm test:system`      |
| e2e         | everything, from device to browser         | devices (replaced by a virtual device) | planned with the UI: a reading shows on a dashboard | —                       |

`pnpm test` runs the fast layers that need no Docker. `pnpm test:all` runs every Vitest layer.
Integration and system tests need Docker running; firmware tests need PlatformIO.

**Integration vs system:** both cover one service with its infrastructure. Integration tests run
the service code in-process and test its behaviour in detail. System tests run what is deployed
(images, compose config, migrations in the container) as a black box, and only check what
integration tests can't: that the shipped stack works, and requirements measured on it. A
behaviour test belongs in integration. **E2E** is reserved for flows that end where the user sees
them, so it starts with the frontend.

## Tools

| Purpose                          | Tool                                      |
| -------------------------------- | ----------------------------------------- |
| TS test runner                   | Vitest, one root config for all packages  |
| database / broker in tests       | Testcontainers                            |
| JSON schema validation           | ajv                                       |
| system test stack                | Docker Compose, with a test override file |
| C++ tests                        | GoogleTest in the PlatformIO `native` env |
| browser tests (once a UI exists) | Playwright                                |

## Where test files go

- **Unit tests** sit next to the file they test: `<file>.test.ts` beside `<file>.ts`.
- **Integration tests** live in `services/<svc>/tests/integration/` as `<feature>.int.test.ts`,
  so slow tests are obvious from the path. Their shared setup goes in `services/<svc>/tests/setup/`.
- **Contract tests** and their fixtures live in `tests/contract/`, since they cover firmware and
  services.
- **System tests** live in `tests/system/` as `<area>.system.test.ts`.
- **E2E tests** will live in `e2e/`.
- **Firmware tests** live in `firmware/test/`, and their snapshots in `firmware/test/snapshots/`.
  The firmware is the only thing that writes the snapshots, so it owns them; everything else reads
  them from there.

## Writing tests

- Test behaviour through a module's exported functions, not its internals. A non-exported helper
  is tested through the function that uses it.
- A unit test mocks only the layer **directly below** the one under test (a service test mocks the
  repository, a handler test mocks the service). Mock it with a factory, so the real module and
  its imports (db, MQTT client) are never loaded.
- The backend layer import rules don't apply to test files, so a test can import the mocked module
  to check its calls.
- Build payloads with the generated event types, so a schema change breaks the tests at compile
  time instead of silently.
- Name tests after the behaviour, not the function: `'keeps metrics of every component'`, not
  `'test mapComponents'`.
- Wait for asynchronous results (MQTT, background handlers) by polling until a timeout, never with
  fixed sleeps.

## Integration tests

- Containers are started once per run and the migrations applied; every test starts from an empty
  database.
- Tests talk to the service the way devices and the frontend do: they publish over MQTT and read
  results over REST.
- Retained messages outlive a test on the broker, so clean up every retained message a test
  publishes.
- Test files run one at a time because they share the database and broker.

## Contract tests

- Every fixture must get the **same verdict** from the JSON schema and from the backend's Zod
  schema: fixtures in `valid/` accepted by both, fixtures in `invalid/` rejected by both. Name an
  invalid fixture after what is wrong with it (`negativeTimestamp.json`).
- When a schema changes, add a valid and an invalid fixture for the change.
- Every firmware snapshot must be accepted by both validators.
- A new schema fails the run until it is added to the test.

## Firmware tests

- They run on the PC, no board needed. Only Arduino-free code can be compiled there, so logic
  worth testing goes into plain C++ libraries, and Arduino-specific code (serial, pins, WiFi, the
  MQTT client) stays a thin layer that calls it.
- Snapshot tests serialize real device payloads and compare them with the committed snapshots.
  When a payload changes on purpose, run `pnpm test:firmware:update`, review the diff and commit
  it; the contract tests then check the new output against the schemas.
- A snapshot records what the firmware sends, not what is correct. Review it like code.

## System tests

- Keep them few: a system test that only checks service behaviour duplicates an integration test.
- The stack runs under its own project name and host ports, so it can run next to the dev stack.
- Requirements from [docs/goals.md](../goals.md) are measured here, e.g. input latency.
- The stack is shared by the whole run, so every test uses a fresh device id and cleans up its
  retained messages.

## Virtual device

`libs/virtual-device` behaves like an ESP on MQTT: same topics, delivery rules and payloads as the
firmware, with the firmware's own snapshot as its default discovery payload. System tests use it
in place of real devices, and `pnpm virtual-device` runs it during development without hardware
(`--help` lists the options).

## Where tests run

- **Pre-commit hook:** the fast tests related to the staged files.
- **CI:** every layer, one job each, on pull requests and pushes to `master`.
- **Claude Code hook:** lint only, no tests.
