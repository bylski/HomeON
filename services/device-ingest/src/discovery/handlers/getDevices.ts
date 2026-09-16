import type { Request, Response } from 'express'
import type { FullDevice } from '../../contract/devices'
import db from '../../libs/drizzle'

export const getDevices = async (req: Request, res: Response) => {
  const fullDevice = await db.query.devices.findMany({
    with: { components: { with: { metricsMetadata: true, commandsMetadata: true } } },
  })

  res.json(fullDevice)
}
