import { Router } from 'express'
import * as mqtt from '../mqtt/index.js'
// import handleDiscovery from './handlers/handleDiscovery.js'
// import { getDevices } from './handlers/getDevices.js'

export const router = Router()

router.get('/devices', async (req, res) => {
  // await getDevices(req, res)
  res.send('')
})

export const listeners = async () => {
  mqtt.onEvent('home-on/discovery/', '#', async (topic, payload) => {
    // await handleDiscovery(topic, payload)
  })
}
