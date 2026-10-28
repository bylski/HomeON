import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upsertDiscoveredDevice } from '../repository/devices.js'
import { saveDiscoveredDevice } from './devices.js'

// factory mock, so the real repository (and the db pool it imports) is never loaded
vi.mock('../repository/devices.js', () => ({
  getAllFullDevices: vi.fn(),
  upsertDiscoveredDevice: vi.fn(),
}))

const upsertMock = vi.mocked(upsertDiscoveredDevice)

/** mirrors the test_sensors firmware: a sensor with a metric and a light with a command */
const DISCOVERY_EVENT: DeviceDiscoveryEvent = {
  device_id: 'test_sensors',
  name: 'Test device',
  components: [
    {
      id: 'ultrasonic_sensor',
      name: 'Distance sensor',
      type: 'SENSOR',
      metrics: [
        {
          metric_id: 'ultrasonic_distance',
          name: 'Ultrasonic sensor distance',
          metric: 'distance',
          unit: 'cm',
          min_value: 0,
        },
      ],
    },
    {
      id: 'red_led_diode',
      name: 'Red led diode',
      type: 'LIGHT',
      commands: [
        {
          command_id: 'switch_led',
          name: 'Switch LED on/off',
          command: 'SWITCH_LED',
          command_topic: '/red_led_diode/switch',
          allowed_values: ['ON', 'OFF'],
          min_value: 0,
          max_value: 1,
        },
      ],
    },
  ],
}

describe('saveDiscoveredDevice', () => {
  beforeEach(() => {
    upsertMock.mockReset()
  })

  it('upserts the device and every component under the device id', async () => {
    await saveDiscoveredDevice(DISCOVERY_EVENT)

    const saved = upsertMock.mock.calls[0][0]
    expect(saved.device).toEqual({ id: 'test_sensors', name: 'Test device' })
    expect(saved.components).toEqual([
      {
        deviceId: 'test_sensors',
        componentId: 'ultrasonic_sensor',
        name: 'Distance sensor',
        type: 'SENSOR',
      },
      {
        deviceId: 'test_sensors',
        componentId: 'red_led_diode',
        name: 'Red led diode',
        type: 'LIGHT',
      },
    ])
  })

  it('links metrics and commands to their component', async () => {
    await saveDiscoveredDevice(DISCOVERY_EVENT)

    const saved = upsertMock.mock.calls[0][0]
    expect(saved.metricsMetadata).toEqual([
      expect.objectContaining({
        deviceId: 'test_sensors',
        componentId: 'ultrasonic_sensor',
        metricId: 'ultrasonic_distance',
      }),
    ])
    expect(saved.commandsMetadata).toEqual([
      expect.objectContaining({
        deviceId: 'test_sensors',
        componentId: 'red_led_diode',
        commandId: 'switch_led',
        allowedValues: ['ON', 'OFF'],
      }),
    ])
  })

  // Drizzle maps Postgres `numeric` to string, so floats are never rounded on the way in
  it('stores min/max values as strings and leaves missing ones undefined', async () => {
    await saveDiscoveredDevice(DISCOVERY_EVENT)

    const saved = upsertMock.mock.calls[0][0]
    expect(saved.metricsMetadata[0]).toMatchObject({ minValue: '0', maxValue: undefined })
    expect(saved.commandsMetadata[0]).toMatchObject({ minValue: '0', maxValue: '1' })
  })

  it('saves a device that reports no components', async () => {
    await saveDiscoveredDevice({ device_id: 'empty', name: 'Empty', components: [] })

    expect(upsertMock).toHaveBeenCalledWith({
      device: { id: 'empty', name: 'Empty' },
      components: [],
      metricsMetadata: [],
      commandsMetadata: [],
    })
  })
})
