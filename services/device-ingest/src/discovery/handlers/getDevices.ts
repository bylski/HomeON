import type { Request, Response } from 'express'
import { getAllDevices } from '../services/devices.js'

export const getDevices = async (req: Request, res: Response) => {
  const fullDevices = await getAllDevices()

  res.json(fullDevices)
}
