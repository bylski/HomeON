import './envConfig.js' // keep at the top to make sure envs are available inside other imports
import express from 'express'
import cors from 'cors'
import * as mqtt from './mqtt/index.js'
import './db/index.js'
import * as discovery from './discovery/index.js'

const app = express()
app.use(cors())
mqtt.setup()

app.use('/discovery', discovery.router)

discovery.listeners()

mqtt.onEvent('home-on/telemetry/', 'test_sensors/ultrasonic_sensor', (d, event) => {
  console.log(`TELEMETRY MESSAGE IS ${JSON.stringify(event)}`)
})

app.listen(process.env.APP_PORT, () => {
  console.log(`Device-ingest listens on port ${process.env.APP_PORT}`)
})
