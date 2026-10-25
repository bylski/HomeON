import type { Request, Response } from 'express'
import { getAllFullDevices } from '../repository/devices.js'

export const getDevices = async (req: Request, res: Response) => {
  const fullDevices = await getAllFullDevices()

  res.json(fullDevices)
}
