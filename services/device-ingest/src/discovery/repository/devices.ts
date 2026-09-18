import type { FullDevice } from '../../contract/devices'
import db from '../../libs/drizzle'

export const getAllFullDevices = async (): Promise<FullDevice[]> =>
  db.query.devices.findMany({
    with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
  })

export const getFullDevice = async (id: string): Promise<FullDevice | undefined> => {
  const device = db.query.devices.findFirst({
    where: { id },
    with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
  })

  if (!device) {
    console.warn('No device found!')
  }

  return device
}
