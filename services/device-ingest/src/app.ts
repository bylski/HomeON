import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import * as mqtt from './libs/mqtt/index.js'
import { DeviceDiscoveryEvent } from '@home-on/generated'

let discoveryEvent: DeviceDiscoveryEvent = { device_id: 'test_sensors' } as any

dotenv.config({
  path: path.resolve(import.meta.dirname, '../../../.env.shared'),
})

const app = express()
app.use(cors())
mqtt.setup()

mqtt.onEvent('home-on/discovery/', '#', (d, event) => {
  console.log(`MESSAGE IS ${JSON.stringify(event)}`)
})

app.get('/on', (req, res) => {
  mqtt.publish(
    `home-on/commands/${discoveryEvent.device_id}/red_led/switch`,
    'ON',
  )
  res.send('ON')
})

app.get('/off', (req, res) => {
  mqtt.publish(
    `home-on/commands/${discoveryEvent.device_id}/red_led/switch`,
    'OFF',
  )
  res.send('OFF')
})

app.listen(3000, () => {
  console.log('APP LISTENS ON PORT 3000')
})
