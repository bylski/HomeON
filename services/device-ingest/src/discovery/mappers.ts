import type {
  CommandMetadataDTO,
  FullComponentDTO,
  FullDeviceDTO,
  MetricMetadataDTO,
} from '../../contract/devices.js'
import type { CommandMetadata } from '../db/schema/commandsMetadata.js'
import type { MetricMetadata } from '../db/schema/metricsMetadata.js'
import type { FullComponentRow, FullDeviceRow } from './types.js'

/** nullable db columns are exposed as optional DTO fields */
const optional = <TValue>(value: TValue | null): TValue | undefined => value ?? undefined

export const toMetricMetadataDTO = (metric: MetricMetadata): MetricMetadataDTO => ({
  id: metric.id,
  metricId: metric.metricId,
  componentId: metric.componentId,
  deviceId: metric.deviceId,
  name: metric.name,
  metric: metric.metric,
  unit: metric.unit,
  minValue: optional(metric.minValue),
  maxValue: optional(metric.maxValue),
})

export const toCommandMetadataDTO = (command: CommandMetadata): CommandMetadataDTO => ({
  id: command.id,
  commandId: command.commandId,
  componentId: command.componentId,
  deviceId: command.deviceId,
  name: command.name,
  command: command.command,
  commandTopic: command.commandTopic,
  allowedValues: optional(command.allowedValues),
  minValue: optional(command.minValue),
  maxValue: optional(command.maxValue),
  description: optional(command.description),
})

export const toFullComponentDTO = (component: FullComponentRow): FullComponentDTO => ({
  id: component.id,
  componentId: component.componentId,
  deviceId: component.deviceId,
  name: component.name,
  type: component.type,
  metricsMetadata: component.metricsMetadata.map(toMetricMetadataDTO),
  commandsMetadata: component.commandsMetadata.map(toCommandMetadataDTO),
})

export const toFullDeviceDTO = (device: FullDeviceRow): FullDeviceDTO => ({
  id: device.id,
  name: device.name,
  components: device.components.map(toFullComponentDTO),
})
