import type { FullDeviceDTO } from '../../../contract/devices.js'
import db from '../../db/index.js'
import { devices } from '../../db/schema/devices.js'
import { components } from '../../db/schema/components.js'
import { metricsMetadata } from '../../db/schema/metricsMetadata.js'
import { commandsMetadata } from '../../db/schema/commandsMetadata.js'
import { prepareUpdateOnConflictSet } from '@home-on/drizzle'
import { buildLogger } from '@home-on/logger/index'
import { toFullDeviceDTO } from '../mappers.js'
import { FULL_DEVICE_WITH, type DiscoveryDataToSave } from '../types.js'

const logger = buildLogger('[DEVICES REPOSITORY]')

export const getAllFullDevices = async (): Promise<FullDeviceDTO[]> => {
  const fullDevices = await db.query.devices.findMany({ with: FULL_DEVICE_WITH })

  return fullDevices.map(toFullDeviceDTO)
}

export const getFullDevice = async (id: string): Promise<FullDeviceDTO | undefined> => {
  const device = await db.query.devices.findFirst({ where: { id }, with: FULL_DEVICE_WITH })

  if (!device) {
    logger.warn(`No device found with id ${id}`)
    return undefined
  }

  return toFullDeviceDTO(device)
}

/** Inserts the discovered device tree, or updates it if the device is already known. */
export const upsertDiscoveredDevice = async (data: DiscoveryDataToSave) => {
  await db.transaction(async (tx) => {
    await tx
      .insert(devices)
      .values(data.device)
      .onConflictDoUpdate({
        set: prepareUpdateOnConflictSet(devices, { id: false, name: true }),
        target: devices.id,
      })

    // drizzle rejects an insert with no values, and a device may report no components at all
    if (data.components.length) {
      await tx
        .insert(components)
        .values(data.components)
        .onConflictDoUpdate({
          set: prepareUpdateOnConflictSet(components, {
            id: false,
            deviceId: false,
            componentId: false,
            name: true,
            type: true,
          }),
          target: [components.deviceId, components.componentId],
        })
    }

    if (data.metricsMetadata.length) {
      await tx
        .insert(metricsMetadata)
        .values(data.metricsMetadata)
        .onConflictDoUpdate({
          set: prepareUpdateOnConflictSet(metricsMetadata, {
            id: false,
            deviceId: false,
            componentId: false,
            metricId: false,
            metric: true,
            name: true,
            maxValue: true,
            minValue: true,
            unit: true,
          }),
          target: [metricsMetadata.deviceId, metricsMetadata.componentId, metricsMetadata.metricId],
        })
    }

    if (data.commandsMetadata.length) {
      await tx
        .insert(commandsMetadata)
        .values(data.commandsMetadata)
        .onConflictDoUpdate({
          set: prepareUpdateOnConflictSet(commandsMetadata, {
            id: false,
            deviceId: false,
            componentId: false,
            commandId: false,
            command: true,
            commandTopic: true,
            name: true,
            maxValue: true,
            minValue: true,
            allowedValues: true,
            description: true,
          }),
          target: [
            commandsMetadata.deviceId,
            commandsMetadata.componentId,
            commandsMetadata.commandId,
          ],
        })
    }
  })
}
