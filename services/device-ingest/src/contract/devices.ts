import type { CommandMetadata } from '../db/schema/commandsMetadata'
import type { Component } from '../db/schema/components'
import type { Device } from '../db/schema/devices'
import type { MetricMetadata } from '../db/schema/metricsMetadata'

type FullComponent = Component & {
  metricsMetadata: MetricMetadata[]
  commandsMetadata: CommandMetadata[]
}

export type FullDevice = Device & {
  components: FullComponent[]
}
