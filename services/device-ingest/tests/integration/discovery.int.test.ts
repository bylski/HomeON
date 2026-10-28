import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
import * as mqttLib from 'mqtt'
import { afterAll, afterEach, beforeAll, describe, expect, inject, it, vi } from 'vitest'
import type { FullDeviceDTO } from '../../contract/devices.js'
import { start } from '../../src/server.js'

const testEnv = inject('testEnv')

let app: Awaited<ReturnType<typeof start>>
let publisher: mqttLib.MqttClient
const retainedTopics = new Set<string>()

/** publishes like a device does: retained, QoS 0 (docs/conventions/mqtt.md) */
const publishDiscovery = async (event: DeviceDiscoveryEvent) => {
  const topic = `home-on/v1/discovery/${event.device_id}`
  retainedTopics.add(topic)
  await publisher.publishAsync(topic, JSON.stringify(event), { qos: 0, retain: true })
}

const getDevices = async (): Promise<FullDeviceDTO[]> => {
  const res = await fetch(`http://localhost:${app.port}/discovery/devices`)
  return res.json()
}

/** polls the REST API until the device shows up and matches the given expectation */
const waitForDevice = (deviceId: string, check: (device: FullDeviceDTO) => void = () => {}) =>
  vi.waitFor(
    async () => {
      const device = (await getDevices()).find(({ id }) => id === deviceId)
      expect(device).toBeDefined()
      check(device!)
      return device!
    },
    { timeout: 5000, interval: 100 },
  )

const sensorDevice = (deviceId: string, name = 'Sensor device'): DeviceDiscoveryEvent => ({
  device_id: deviceId,
  name,
  components: [
    {
      id: 'ultrasonic_sensor',
      name: 'Distance sensor',
      type: 'SENSOR',
      metrics: [
        {
          metric_id: `${deviceId}_distance`,
          name: 'Distance',
          metric: 'distance',
          unit: 'cm',
        },
      ],
      commands: [
        {
          command_id: `${deviceId}_calibrate`,
          name: 'Calibrate',
          command: 'CALIBRATE',
          command_topic: '/ultrasonic_sensor/calibrate',
        },
      ],
    },
  ],
})

describe('discovery', () => {
  beforeAll(async () => {
    app = await start(0)
    publisher = await mqttLib.connectAsync({
      host: testEnv.ENV_MQTT_HOST,
      port: +testEnv.ENV_MQTT_PORT,
    })
  })

  // retained messages outlive a test, so clear them (an empty retained payload deletes one)
  afterEach(async () => {
    for (const topic of retainedTopics) {
      await publisher.publishAsync(topic, '', { retain: true })
    }
    retainedTopics.clear()
  })

  afterAll(async () => {
    await publisher.endAsync()
    await app.stop()
  })

  it('saves a discovered device and returns it over REST', async () => {
    await publishDiscovery(sensorDevice('kitchen', 'Kitchen sensor'))

    const device = await waitForDevice('kitchen')
    expect(device.name).toBe('Kitchen sensor')
    expect(device.components).toHaveLength(1)
    expect(device.components[0].metricsMetadata).toHaveLength(1)
  })

  it('keeps metrics and commands of devices sharing a component id apart', async () => {
    await publishDiscovery(sensorDevice('kitchen'))
    await publishDiscovery(sensorDevice('hallway'))

    const check = (deviceId: string) => (device: FullDeviceDTO) => {
      const [component] = device.components
      expect(component.metricsMetadata.map(({ metricId }) => metricId)).toEqual([
        `${deviceId}_distance`,
      ])
      expect(component.commandsMetadata.map(({ commandId }) => commandId)).toEqual([
        `${deviceId}_calibrate`,
      ])
    }
    await waitForDevice('kitchen', check('kitchen'))
    await waitForDevice('hallway', check('hallway'))
  })

  it('updates a known device instead of duplicating it when it is rediscovered', async () => {
    await publishDiscovery(sensorDevice('kitchen', 'Old name'))
    await waitForDevice('kitchen')

    await publishDiscovery(sensorDevice('kitchen', 'New name'))

    await waitForDevice('kitchen', (device) => expect(device.name).toBe('New name'))
    const devices = await getDevices()
    expect(devices).toHaveLength(1)
    expect(devices[0].components).toHaveLength(1)
  })

  it('keeps handling messages after a malformed payload', async () => {
    await publisher.publishAsync('home-on/v1/discovery/broken', 'not json')
    await publisher.publishAsync('home-on/v1/discovery/broken', JSON.stringify({ device_id: 1 }))
    await publishDiscovery(sensorDevice('kitchen'))

    await waitForDevice('kitchen')
    expect(await getDevices()).toHaveLength(1)
  })

  // the broker hands retained discovery events to every new subscriber (docs/conventions/mqtt.md)
  it('picks up devices that announced themselves while the service was down', async () => {
    await app.stop()
    await publishDiscovery(sensorDevice('kitchen'))

    app = await start(0)

    await waitForDevice('kitchen')
  })
})
