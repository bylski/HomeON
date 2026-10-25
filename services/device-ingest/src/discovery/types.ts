import type { QueryResult, QueryWith } from '../db/types.js'
import type { NewDevice } from '../db/schema/devices.js'
import type { NewComponent } from '../db/schema/components.js'
import type { NewMetricMetadata } from '../db/schema/metricsMetadata.js'
import type { NewCommandMetadata } from '../db/schema/commandsMetadata.js'

/** relations loaded whenever a device is returned in full */
export const FULL_DEVICE_WITH = {
  components: { with: { metricsMetadata: true, commandsMetadata: true } },
} as const satisfies QueryWith<'devices'>

export type FullDeviceRow = QueryResult<'devices', typeof FULL_DEVICE_WITH>
export type FullComponentRow = FullDeviceRow['components'][number]

/** flattened rows of a single discovery event, ready to be upserted */
export type DiscoveryDataToSave = {
  device: NewDevice
  components: NewComponent[]
  metricsMetadata: NewMetricMetadata[]
  commandsMetadata: NewCommandMetadata[]
}
