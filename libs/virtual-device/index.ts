import fs from 'node:fs'
import path from 'node:path'
import type {
  ComponentCommandEvent,
  ComponentTelemetryEvent,
  DeviceDiscoveryEvent,
} from '@home-on/generated/events'
import * as mqtt from 'mqtt'

export type VirtualDeviceOptions = {
  brokerUrl: string
  username?: string
  password?: string
  discovery: DeviceDiscoveryEvent
}

export type VirtualDevice = Awaited<ReturnType<typeof createVirtualDevice>>

type CommandHandler = (event: ComponentCommandEvent) => void

/**
 * The discovery payload the real `test_sensors` firmware sends, read from the snapshot its
 * native tests keep up to date (tests/contract/snapshots), with the device id swapped.
 */
export const firmwareDiscovery = (
  deviceId: string,
  name = 'Virtual device',
): DeviceDiscoveryEvent => {
  const snapshotPath = path.resolve(
    import.meta.dirname,
    '../../tests/contract/snapshots/discovery/testSensors.json',
  )
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')) as DeviceDiscoveryEvent
  return { ...snapshot, device_id: deviceId, name }
}

/**
 * Connects to the broker and behaves like an ESP device: same topics and delivery rules as the
 * firmware (docs/conventions/mqtt.md).
 */
export const createVirtualDevice = async ({
  brokerUrl,
  username,
  password,
  discovery,
}: VirtualDeviceOptions) => {
  const deviceId = discovery.device_id
  const discoveryTopic = `home-on/v1/discovery/${deviceId}`
  const client = await mqtt.connectAsync(brokerUrl, { username, password, clientId: deviceId })

  const commandHandlers = new Map<string, CommandHandler[]>()
  client.on('message', (topic, buffer) => {
    for (const handler of commandHandlers.get(topic) ?? []) {
      handler(JSON.parse(buffer.toString()))
    }
  })

  return {
    deviceId,
    discovery,

    /** retained, so services that start later still learn about the device */
    announce: () =>
      client.publishAsync(discoveryTopic, JSON.stringify(discovery), { qos: 0, retain: true }),

    sendTelemetry: (event: ComponentTelemetryEvent) =>
      client.publishAsync(`home-on/v1/telemetry/${deviceId}/${event.id}`, JSON.stringify(event), {
        qos: 0,
      }),

    /** commands use QoS 1, so the handler may run twice for one command (they are idempotent) */
    onCommand: async (componentId: string, command: string, handler: CommandHandler) => {
      const topic = `home-on/v1/commands/${deviceId}/${componentId}/${command}`
      if (!commandHandlers.has(topic)) {
        await client.subscribeAsync(topic, { qos: 1 })
      }
      commandHandlers.set(topic, [...(commandHandlers.get(topic) ?? []), handler])
    },

    /** deletes the retained discovery event, as if the device had never been there */
    forget: () => client.publishAsync(discoveryTopic, '', { qos: 0, retain: true }),

    disconnect: () => client.endAsync(),
  }
}
