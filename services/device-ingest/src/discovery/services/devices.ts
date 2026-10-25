import type { DeviceDiscoveryEvent } from '@home-on/generated/events'
import type { NewDevice } from '../../db/schema/devices.js'
import type { NewComponent } from '../../db/schema/components.js'
import type { NewMetricMetadata } from '../../db/schema/metricsMetadata.js'
import type { NewCommandMetadata } from '../../db/schema/commandsMetadata.js'
import { upsertDiscoveredDevice } from '../repository/devices.js'
import type { DiscoveryDataToSave } from '../types.js'

export const saveDiscoveredDevice = async (event: DeviceDiscoveryEvent) => {
  await upsertDiscoveredDevice(extractDiscoveryDataToSave(event))
}

const extractDiscoveryDataToSave = (event: DeviceDiscoveryEvent): DiscoveryDataToSave => {
  const newDevice: NewDevice = { id: event.device_id, name: event.name }
  const newComponents: NewComponent[] = []
  const newMetricsMetadata: NewMetricMetadata[] = []
  const newCommandsMetadata: NewCommandMetadata[] = []

  for (const component of event.components) {
    newComponents.push({
      deviceId: event.device_id,
      name: component.name,
      componentId: component.id,
      type: component.type,
    })

    for (const metric of component.metrics ?? []) {
      newMetricsMetadata.push({
        deviceId: event.device_id,
        componentId: component.id,
        metricId: metric.metric_id,
        name: metric.name,
        metric: metric.metric,
        unit: metric.unit,
        minValue: metric.min_value?.toString(),
        maxValue: metric.max_value?.toString(),
      })
    }

    for (const command of component.commands ?? []) {
      newCommandsMetadata.push({
        deviceId: event.device_id,
        componentId: component.id,
        commandId: command.command_id,
        name: command.name,
        command: command.command,
        commandTopic: command.command_topic,
        allowedValues: command.allowed_values,
        description: command.description,
        minValue: command.min_value?.toString(),
        maxValue: command.max_value?.toString(),
      })
    }
  }

  return {
    device: newDevice,
    components: newComponents,
    metricsMetadata: newMetricsMetadata,
    commandsMetadata: newCommandsMetadata,
  }
}
