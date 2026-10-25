# MQTT

## Topic structure

```
home-on/v1/<event-type>/<device_id>[/<component_id>[/<command>]]
```

| Event     | Topic                                                      |
| --------- | ---------------------------------------------------------- |
| discovery | `home-on/v1/discovery/<device_id>`                         |
| telemetry | `home-on/v1/telemetry/<device_id>/<component_id>`          |
| command   | `home-on/v1/commands/<device_id>/<component_id>/<command>` |

- The root segment `home-on` is kebab-case. `device_id`, `component_id` and command names are
  snake_case, the same as the IDs in the schemas.
- The version segment (`v1`) changes only on breaking contract changes, so old firmware keeps
  working on its old topics during a migration.
- Backend subscriptions support the `#` wildcard but not `+`.

## Delivery rules

| Event     | QoS | Retain | Why                                                                     |
| --------- | --- | ------ | ----------------------------------------------------------------------- |
| discovery | 0   | yes    | a restarted backend gets every device's last discovery event right away |
| telemetry | 0   | no     | a new reading follows shortly; a stale retained reading would mislead   |
| commands  | 1   | no     | must not be lost; retaining would replay the command on every reconnect |

- QoS 1 can deliver a message twice, so commands must be **idempotent**: send absolute states
  (`set ON`, `set 40%`), never relative ones (`toggle`, `+10%`).
- QoS 2 is not used (PubSubClient on the ESP does not support publishing with it).
