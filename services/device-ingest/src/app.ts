import './envConfig.js' // keep at the top to make sure envs are available inside other imports
import express from 'express'
import cors from 'cors'
import * as mqtt from './mqtt/index.js'
import './db/index.js'
import * as discovery from './discovery/index.js'
import { buildLogger } from '@home-on/logger/index'

const logger = buildLogger('[APP]')

const app = express()
app.use(cors())
mqtt.setup()

app.use('/discovery', discovery.router)

discovery.listeners()

mqtt.onEvent('home-on/v1/telemetry/', 'test_sensors/ultrasonic_sensor', (_topic, event) => {
  logger.info(`Telemetry message: ${JSON.stringify(event)}`)
})

app.listen(process.env.APP_PORT, () => {
  logger.info(`Device-ingest listens on port ${process.env.APP_PORT}`)
})
