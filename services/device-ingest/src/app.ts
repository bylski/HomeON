import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import * as mqtt from './libs/mqtt/index.js'

dotenv.config({
  path: path.resolve(import.meta.dirname, '../../../.env.shared'),
})

const app = express()
mqtt.setup()

mqtt.onEvent('home/sensor/pin_state', (d, a) => {
  a.toString()
  console.log(`MESSAGE IS ${a}`)
})

app.listen(3000, () => {
  console.log('APP LISTENS ON PORT 3000')
})
