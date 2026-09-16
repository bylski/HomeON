import type { DeviceDiscoveryEvent } from '@home-on/generated'
import { devices, type NewDevice } from '../../db/schema/devices'
import { components, type Component, type NewComponent } from '../../db/schema/components'
import { metricsMetadata, type NewMetricMetadata } from '../../db/schema/metricsMetadata'
import { commandsMetadata, type NewCommandMetadata } from '../../db/schema/commandsMetadata'
import db, { prepareUpdateOnConflictSet } from '../../libs/drizzle'
import { and, eq, sql } from 'drizzle-orm'

type DiscoveryDataToSave = {
  device: NewDevice
  components: NewComponent[]
  metricsMetadata: NewMetricMetadata[]
  commandsMetadata: NewCommandMetadata[]
}

const handleDiscovery = async (topic: string, payload: DeviceDiscoveryEvent) => {
  const toSave = extractDiscoveryDataToSave(payload)

  db.transaction(async (tx) => {
    const deviceId = toSave.device.id
    // devices should have static id - if changed it is treated as new device
    await tx.insert(devices).values(toSave.device).onConflictDoNothing()
    // remove possibly stale metadata
    await db.delete(components).where(eq(components.deviceId, deviceId))
    await db.delete(commandsMetadata).where(eq(commandsMetadata.deviceId, deviceId))
    await db.delete(metricsMetadata).where(eq(metricsMetadata.deviceId, deviceId))
    // fill db with new metadata
    await db.insert(components).values(toSave.components)
    await db.insert(commandsMetadata).values(toSave.commandsMetadata)
    await db.insert(metricsMetadata).values(toSave.metricsMetadata)
  })
}

export default handleDiscovery

const extractDiscoveryDataToSave = (event: DeviceDiscoveryEvent): DiscoveryDataToSave => {
  const newDevice: NewDevice = { id: event.device_id }
  const newComponents: NewComponent[] = []
  const newMetricsMetadata: NewMetricMetadata[] = []
  const newCommandsMetadata: NewCommandMetadata[] = []

  for (const component of event.components) {
    newComponents.push({
      deviceId: event.device_id,
      componentId: component.id,
      type: component.type,
    })

    for (const metric of component.metrics ?? []) {
      newMetricsMetadata.push({
        deviceId: event.device_id,
        componentId: component.id,
        metric: metric.metric_id,
        unit: metric.unit,
        minValue: metric.min_value?.toString(),
        maxValue: metric.max_value?.toString(),
      })
    }

    for (const command of component.commands ?? []) {
      newCommandsMetadata.push({
        deviceId: event.device_id,
        componentId: component.id,
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
