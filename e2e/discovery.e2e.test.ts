import { performance } from 'node:perf_hooks'
import { createVirtualDevice, firmwareDiscovery, type VirtualDevice } from '@home-on/virtual-device'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FullDeviceDTO } from '../services/device-ingest/contract/devices.js'

// host ports of the e2e stack (compose.e2e.yml)
const API_URL = 'http://localhost:13000'
const BROKER_URL = 'mqtt://localhost:11883'

// non-functional requirement: input lag must not exceed 5 seconds (docs/goals.md)
const MAX_LATENCY_MS = 5000

const devices: VirtualDevice[] = []

/** a virtual device sending exactly what the test_sensors firmware sends, under a fresh id */
const connectDevice = async () => {
  const deviceId = `e2e_${Math.random().toString(36).slice(2, 8)}`
  const device = await createVirtualDevice({
    brokerUrl: BROKER_URL,
    discovery: firmwareDiscovery(deviceId),
  })
  devices.push(device)
  return device
}

const getDevice = async (deviceId: string) => {
  const res = await fetch(`${API_URL}/discovery/devices`)
  expect(res.ok).toBe(true)
  const all: FullDeviceDTO[] = await res.json()
  return all.find(({ id }) => id === deviceId)
}

const waitForDevice = (deviceId: string) =>
  vi.waitFor(
    async () => {
      const device = await getDevice(deviceId)
      expect(device).toBeDefined()
      return device!
    },
    { timeout: MAX_LATENCY_MS, interval: 50 },
  )

describe('device discovery through the whole stack', () => {
  // the stack lives for the whole run, so remove every retained announcement again
  afterEach(async () => {
    for (const device of devices.splice(0)) {
      await device.forget()
      await device.disconnect()
    }
  })

  it(`lists a device within ${MAX_LATENCY_MS / 1000} s of it announcing itself`, async () => {
    const device = await connectDevice()

    const startedAt = performance.now()
    await device.announce()
    await waitForDevice(device.deviceId)
    const latencyMs = performance.now() - startedAt

    expect(latencyMs).toBeLessThan(MAX_LATENCY_MS)
  })

  it('stores the whole component tree the firmware announces', async () => {
    const device = await connectDevice()
    await device.announce()

    const stored = await waitForDevice(device.deviceId)

    const announced = device.discovery.components
    expect(stored.components.map(({ componentId }) => componentId).sort()).toEqual(
      announced.map(({ id }) => id).sort(),
    )
    for (const component of announced) {
      const storedComponent = stored.components.find(
        ({ componentId }) => componentId === component.id,
      )
      expect(storedComponent?.metricsMetadata.map(({ metricId }) => metricId)).toEqual(
        (component.metrics ?? []).map((metric) => metric.metric_id),
      )
      expect(storedComponent?.commandsMetadata.map(({ commandId }) => commandId)).toEqual(
        (component.commands ?? []).map((command) => command.command_id),
      )
    }
  })

  it('keeps serving requests while a device streams telemetry, including invalid payloads', async () => {
    const device = await connectDevice()
    await device.announce()
    await waitForDevice(device.deviceId)

    // about 2 s of the firmware's 200 ms telemetry loop, plus garbage a faulty device might send
    for (let i = 0; i < 10; i++) {
      await device.sendTelemetry({
        id: 'ultrasonic_sensor',
        metric: 'distance',
        value: i,
        unit: 'cm',
      })
    }
    await device.sendRaw('ultrasonic_sensor', 'not json')
    await device.sendRaw('ultrasonic_sensor', JSON.stringify({ value: { nested: true } }))

    expect(await getDevice(device.deviceId)).toBeDefined()
  })
})
