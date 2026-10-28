import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
import { EventEmitter } from 'node:events'
import * as mqttLib from 'mqtt'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { disconnect, onEvent, setup } from './index.js'

// a fake client lets tests push messages in as if they came from the broker; like the real
// connect(), every call returns a new client
vi.mock('mqtt', () => ({
  connect: vi.fn(() =>
    Object.assign(new EventEmitter(), {
      subscribe: vi.fn(),
      publish: vi.fn(),
      endAsync: vi.fn(),
    }),
  ),
  ErrorWithReasonCode: class {},
}))

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
vi.mock('@home-on/logger/index', () => ({ buildLogger: () => logger }))

const DISCOVERY_TOPIC = 'home-on/v1/discovery/test_sensors'
const VALID_DISCOVERY: DeviceDiscoveryEvent = {
  device_id: 'test_sensors',
  name: 'Test',
  components: [],
}

let fakeClient: EventEmitter

/** delivers a message the way mqtt.js does: synchronously, with a Buffer payload */
const receive = (topic: string, payload: string) =>
  fakeClient.emit('message', topic, Buffer.from(payload))

// lets async callbacks (and their rejections) settle before asserting
const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('mqtt message handling', () => {
  beforeEach(() => {
    setup()
    fakeClient = vi.mocked(mqttLib.connect).mock.results.at(-1)?.value
  })

  afterEach(async () => {
    await disconnect()
    vi.clearAllMocks()
  })

  it('passes a valid payload to the subscribed callback', async () => {
    const callback = vi.fn()
    onEvent('home-on/v1/discovery/', '#', callback)

    receive(DISCOVERY_TOPIC, JSON.stringify(VALID_DISCOVERY))
    await flush()

    expect(callback).toHaveBeenCalledWith(DISCOVERY_TOPIC, VALID_DISCOVERY)
  })

  it('drops a payload that fails validation without throwing', async () => {
    const callback = vi.fn()
    onEvent('home-on/v1/discovery/', '#', callback)

    expect(() => receive(DISCOVERY_TOPIC, JSON.stringify({ device_id: 42 }))).not.toThrow()
    await flush()

    expect(callback).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid payload'))
  })

  it('drops a payload that is not JSON without throwing', async () => {
    const callback = vi.fn()
    onEvent('home-on/v1/discovery/', '#', callback)

    expect(() => receive(DISCOVERY_TOPIC, 'not json')).not.toThrow()
    await flush()

    expect(callback).not.toHaveBeenCalled()
  })

  // Vitest fails the run on an unhandled rejection, so this also proves nothing escapes
  it('logs a failing callback and keeps handling later messages', async () => {
    const callback = vi.fn().mockRejectedValueOnce(new Error('db down'))
    onEvent('home-on/v1/discovery/', '#', callback)

    receive(DISCOVERY_TOPIC, JSON.stringify(VALID_DISCOVERY))
    receive(DISCOVERY_TOPIC, JSON.stringify(VALID_DISCOVERY))
    await flush()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('db down'))
  })
})
