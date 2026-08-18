import * as mqtt from 'mqtt'
import { buildLogger } from '../logger/index.js'

type Topic = string

let client: mqtt.MqttClient
const subscriptions: Set<Topic> = new Set()

const logger = buildLogger('[MQTT]')

export const setup = () => {
  const host = process.env.ENV_MQTT_HOST
  const port = +(process.env.ENV_MQTT_PORT ?? '')

  client = mqtt.connect({
    host,
    username: process.env.ENV_MQTT_USERNAME,
    password: process.env.ENV_MQTT_PASSWORD,
    protocol: 'mqtt',
    port,
  })

  client.on('connect', () => {
    logger.info(`Successfully connected to MQTT client ${host} on port ${port}`)
  })
  client.on('disconnect', () => {
    logger.info(`Connection terminated for MQTT client ${host}, port ${port}`)
  })
}

export const onEvent = (topic: Topic, callback: mqtt.OnMessageCallback) => {
  if (!subscriptions.has(topic)) {
    client.subscribe(topic)
  }
  client.on('message', callback)
  client.on('error', (error) => {
    if (error instanceof mqtt.ErrorWithReasonCode) {
      logger.info(
        `Topic ${topic} failed with error: ${JSON.stringify(error, null, 2)}`,
      )
    }
  })
}
