import type { Request, Response } from 'express'
import type { FullDevice } from '../../contract/devices'
import db from '../../libs/drizzle'
import { getAllFullDevices } from '../repository/devices'

export const getDevices = async (req: Request, res: Response) => {
  const fullDevices = await getAllFullDevices()

  res.json(fullDevices)
}
