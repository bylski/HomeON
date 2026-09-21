import type { FullDeviceDTO } from '../../../contract/devices'
import db from '../../db/index'

export const getAllFullDevices = async (): Promise<FullDeviceDTO[]> =>
  db.query.devices.findMany({
    with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
  })

export const getFullDevice = async (id: string): Promise<FullDeviceDTO | undefined> => {
  const device = db.query.devices.findFirst({
    where: { id },
    with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
  })

  if (!device) {
    console.warn('No device found!')
  }

  return device
}
