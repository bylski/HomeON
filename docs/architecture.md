# Architecture

```
 ESP devices ──MQTT──▶ broker ──▶ device-ingest ──▶ Postgres
 (firmware)   ◀──────           (+ other services)     │
                                       │ REST          │
                                       ▼               │
                                   frontend ◀──────────┘ (via services)
```

All server-side parts run as Docker containers on a Raspberry Pi 3B+ under Docker Compose.

## Communication

- Devices and services communicate only over **MQTT**. The topic structure and delivery rules are
  in [conventions/mqtt.md](conventions/mqtt.md).
- Sensors publish data on specific topics. **More than one service may listen to the same
  topics**, and that is preferred over funnelling everything through a single service.
- The frontend talks to services over REST.
- The three event types (discovery, telemetry, commands) are defined once in `config/schemas/` and
  generated into C++ and TypeScript. See [conventions/contracts.md](conventions/contracts.md).

## Services

### frontend (`services/frontend`)

A React (Vite) app. It is only the visual layer and fetches all its data from the services.
Currently a bare scaffold.

### device-ingest (`services/device-ingest`)

Captures data coming from devices:

- **discovery:** listens on the discovery topics and upserts devices, their components, and
  metric/command metadata into Postgres. Exposes `GET /discovery/devices`.
- **telemetry:** subscribes to telemetry topics (storage still to be built).

### controller (planned, name TBD)

Owns everything about automations and the settings of individual devices.

## Firmware

A PlatformIO project in `firmware/`. Reusable libraries (`lib/WifiService`, `lib/Mqtt`) are
shared by all devices. Each physical device has its own folder in `devices/<device_id>/`.

## Open questions

- How pairing over mDNS fits in alongside MQTT discovery.
- OTA upload: how it's delivered and how it's secured.
- Security: TLS for MQTT and HTTP, how the frontend and APIs are authenticated.
- Where telemetry is stored (plain Postgres or a time-series extension) and which service owns it.
- Controller scope, and whether it shares a database with device-ingest.
- Whether the MQTT broker and Postgres get added to `compose.yml`.
- Whether the Pi runs a 32- or 64-bit OS. It decides the image platform (`linux/arm/v7` or
  `linux/arm64`) and the ARM build check still to be added to CI.
