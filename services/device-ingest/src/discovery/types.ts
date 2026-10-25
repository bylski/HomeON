import type { QueryResult, QueryWith } from '../db/types.js'

/** relations loaded whenever a device is returned in full */
export const FULL_DEVICE_WITH = {
  components: { with: { metricsMetadata: true, commandsMetadata: true } },
} as const satisfies QueryWith<'devices'>

export type FullDeviceRow = QueryResult<'devices', typeof FULL_DEVICE_WITH>
export type FullComponentRow = FullDeviceRow['components'][number]
