import { performance } from 'node:perf_hooks'
import { createVirtualDevice, firmwareDiscovery, type VirtualDevice } from '@home-on/virtual-device'
import { afterEach, describe, expect, inject, it, vi } from 'vitest'
import type { FullDeviceDTO } from '../../services/device-ingest/contract/devices.js'

// only what the in-process integration tests can't cover: the shipped images and compose wiring,
// and requirements measured on the running system (docs/conventions/testing.md)

// docker picks the host ports when the stack starts
const { apiUrl: API_URL, brokerUrl: BROKER_URL } = inject('systemStack')

// non-functional requirement: input lag must not exceed 5 seconds (docs/goals.md)
const MAX_LATENCY_MS = 5000

const devices: VirtualDevice[] = []

const getDevices = async (): Promise<FullDeviceDTO[]> => {
  const res = await fetch(`${API_URL}/discovery/devices`)
  expect(res.ok).toBe(true)
  return res.json()
}

describe('the shipped stack', () => {
  // the stack lives for the whole run, so remove every retained announcement again
  afterEach(async () => {
    for (const device of devices.splice(0)) {
      await device.forget()
      await device.disconnect()
    }
  })

  // the device list is read from the db, so this needs the image, the db config and the
  // migrations applied in the container
  it('answers over REST', async () => {
    expect(Array.isArray(await getDevices())).toBe(true)
  })

  // a device sending exactly what the reference device's firmware sends reaches the API through
  // the real broker, so this also proves the MQTT wiring
  it(`lists a device within ${MAX_LATENCY_MS / 1000} s of it announcing itself`, async () => {
    const deviceId = `system_${Math.random().toString(36).slice(2, 8)}`
    const device = await createVirtualDevice({
      brokerUrl: BROKER_URL,
      discovery: firmwareDiscovery(deviceId),
    })
    devices.push(device)

    const startedAt = performance.now()
    await device.announce()
    await vi.waitFor(
      async () => expect((await getDevices()).some(({ id }) => id === deviceId)).toBe(true),
      { timeout: MAX_LATENCY_MS, interval: 50 },
    )

    expect(performance.now() - startedAt).toBeLessThan(MAX_LATENCY_MS)
  })
})
