import express from 'express'
import cors from 'cors'
import * as discovery from './discovery/index.js'

/** Builds the HTTP app without side effects, so tests can use it without a port or MQTT. */
export const createApp = () => {
  const app = express()
  app.use(cors())

  app.use('/discovery', discovery.router)

  return app
}
