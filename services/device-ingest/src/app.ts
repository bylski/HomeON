import './envConfig.js' // keep at the top to make sure envs are available inside other imports
import express from 'express'
import cors from 'cors'
import * as mqtt from './libs/mqtt/index.js'
import './libs/drizzle'

const app = express()
app.use(cors())
mqtt.setup()

mqtt.onEvent('home-on/discovery/', '#', (d, event) => {
  console.log(`MESSAGE IS ${JSON.stringify(event)}`)
})

mqtt.onEvent('home-on/telemetry/', 'test_sensors/ultrasonic_sensor', (d, event) => {
  console.log(`TELEMETRY MESSAGE IS ${JSON.stringify(event)}`)
})

app.listen(3000, () => {
  console.log('APP LISTENS ON PORT 3000')
})
