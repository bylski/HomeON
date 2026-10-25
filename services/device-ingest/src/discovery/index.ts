import { Router } from 'express'
import * as mqtt from '../mqtt/index.js'
import handleDiscovery from './handlers/handleDiscovery.js'
import { getDevices } from './handlers/getDevices.js'

export const router = Router()

router.get('/devices', async (req, res) => {
  await getDevices(req, res)
})

export const listeners = async () => {
  mqtt.onEvent('home-on/v1/discovery/', '#', async (topic, payload) => {
    await handleDiscovery(topic, payload)
  })
}
