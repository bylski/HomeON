import type { FullDeviceDTO } from '../../../contract/devices.js'
import db from '../../db/index.js'
import type { Device } from '../../db/schema/devices.js'

//fixme should return DTO
// export const getAllFullDevices = async (): Promise<Device[]> =>
//   db.query.devices.findMany({
//     with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
//   })

// export const getFullDevice = async (id: string): Promise<Device | undefined> => {
//   const device = db.query.devices.findFirst({
//     where: { id },
//     with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
//   })

//   if (!device) {
//     console.warn('No device found!')
//   }

//   return device
// }
