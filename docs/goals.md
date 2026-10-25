# Goals

HomeOn is an application for managing devices built on ESP-family microcontrollers. It also
monitors their inputs, outputs and any other data they expose.

## Functional requirements

1. **Pairing with ESP devices over mDNS.** The ESP must first be flashed with the right base
   firmware.
2. **Secure over-the-air (OTA) firmware upload** to ESP devices.
3. **Collecting data from ESP devices** and visualising it in the web app.

## Non-functional requirements

1. **Security:** data must be encrypted and clients must be authenticated.
2. **Latency:** input lag must not exceed **5 seconds**.
3. **Runs on a Raspberry Pi 3B+** using Docker Compose (Kubernetes won't fit). A microservice
   architecture is used on purpose, even if it's overkill for this scale.

## Firmware provisioning

Each ESP needs firmware that configures it and lets it connect to the web app. In the future this
could be generated and flashed from the web app itself (to be decided). For the MVP it's done by
hand from a base template (`firmware/devices/<device_id>/`, flashed with `pnpm upload <env>`).

## Devices

The first devices are deliberately simple and use only analog and digital inputs and outputs.
Communication over SPI or I2C is out of scope for now. The current reference device is
`test_sensors`: an ultrasonic distance sensor plus an LED.

## Status

| Requirement          | Status                                                               |
| -------------------- | -------------------------------------------------------------------- |
| Device discovery     | done over MQTT (discovery event + upsert into Postgres); no mDNS yet |
| Telemetry collection | in progress: firmware publishes, backend receives, not stored yet    |
| Visualisation        | not started (frontend scaffold only)                                 |
| Commands to devices  | contract defined, not implemented end to end                         |
| OTA upload           | not started                                                          |
| Encryption / auth    | not started (MQTT uses username + password, no TLS)                  |
