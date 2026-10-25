# Repository layout

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
