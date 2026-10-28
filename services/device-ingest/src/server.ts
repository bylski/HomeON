import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import { buildLogger } from '@home-on/logger/index'
import { createApp } from './app.js'
import * as mqtt from './mqtt/index.js'
import * as discovery from './discovery/index.js'

const logger = buildLogger('[APP]')

/**
 * Connects to MQTT, registers listeners and starts the HTTP server.
 * Port 0 lets the OS pick a free port (used by tests). Resolves once the server listens.
 */
export const start = async (port: number) => {
  mqtt.setup()
  discovery.listeners()

  mqtt.onEvent('home-on/v1/telemetry/', 'test_sensors/ultrasonic_sensor', (_topic, event) => {
    logger.info(`Telemetry message: ${JSON.stringify(event)}`)
  })

  const server = createApp().listen(port)
  await once(server, 'listening')
  const actualPort = (server.address() as AddressInfo).port
  logger.info(`Device-ingest listens on port ${actualPort}`)

  const stop = async () => {
    server.close()
    await Promise.all([once(server, 'close'), mqtt.disconnect()])
  }

  return { port: actualPort, stop }
}
