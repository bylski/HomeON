import type { Request, Response } from 'express'
import { getAllFullDevices } from '../repository/devices'

export const getDevices = async (req: Request, res: Response) => {
  const fullDevices = await getAllFullDevices()

  res.json(fullDevices)
}
