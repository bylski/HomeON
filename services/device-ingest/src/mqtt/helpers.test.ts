import { describe, expect, it } from 'vitest'
import { getTopicWildcardVariations } from './helpers.js'

describe('getTopicWildcardVariations', () => {
  it('returns only the root wildcard for a device-level topic', () => {
    expect(
      getTopicWildcardVariations('home-on/v1/discovery/', 'home-on/v1/discovery/test_sensors'),
    ).toEqual(['home-on/v1/discovery/#'])
  })

  it('returns every parent level of a component topic, deepest first', () => {
    expect(
      getTopicWildcardVariations(
        'home-on/v1/telemetry/',
        'home-on/v1/telemetry/test_sensors/ultrasonic_sensor',
      ),
    ).toEqual(['home-on/v1/telemetry/test_sensors/#', 'home-on/v1/telemetry/#'])
  })

  it('returns every parent level of a command topic, deepest first', () => {
    expect(
      getTopicWildcardVariations(
        'home-on/v1/commands/',
        'home-on/v1/commands/test_sensors/red_led_diode/switch',
      ),
    ).toEqual([
      'home-on/v1/commands/test_sensors/red_led_diode/#',
      'home-on/v1/commands/test_sensors/#',
      'home-on/v1/commands/#',
    ])
  })
})
