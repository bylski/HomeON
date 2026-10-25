import type { FullDeviceDTO } from '../../../contract/devices.js'
import db from '../../db/index.js'
import { toFullDeviceDTO } from '../mappers.js'
import { FULL_DEVICE_WITH } from '../types.js'

export const getAllFullDevices = async (): Promise<FullDeviceDTO[]> => {
  const devices = await db.query.devices.findMany({ with: FULL_DEVICE_WITH })

  return devices.map(toFullDeviceDTO)
}

export const getFullDevice = async (id: string): Promise<FullDeviceDTO | undefined> => {
  const device = await db.query.devices.findFirst({ where: { id }, with: FULL_DEVICE_WITH })

  if (!device) {
    console.warn('No device found!')
    return undefined
  }

  return toFullDeviceDTO(device)
}
