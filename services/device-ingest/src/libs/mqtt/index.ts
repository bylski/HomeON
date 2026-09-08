import * as mqtt from 'mqtt'
import { buildLogger } from '../logger/index.js'
import type { TopicPayload, TopicPrefix } from '../../types/events.js'
import type { TopicPrefixesWithTypes } from '@home-on/generated'
import { validateBaseTopicEvent } from '../validator/index.js'

let client: mqtt.MqttClient
const subscriptions: Set<string> = new Set()

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

export const onEvent = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  topicSuffix: string,
  callback: (topic: string, payload: TopicPayload<TPrefix>) => void,
) => {
  const topic = topicPrefix + topicSuffix

  if (!subscriptions.has(topic)) {
    client.subscribe(topic)
    subscriptions.add(topic)
  }
  const mqttCallback: mqtt.OnMessageCallback = (topic, buffer) => {
    let eventPayload = JSON.parse(buffer.toString())
    eventPayload.x = 'unknown field' // test - should fail
    const validPayload = validateBaseTopicEvent(topicPrefix, eventPayload)
    callback(topic, validPayload)
  }

  client.on('message', mqttCallback)
  client.on('error', (error) => {
    if (error instanceof mqtt.ErrorWithReasonCode) {
      logger.info(
        `Topic ${topic} failed with error: ${JSON.stringify(error, null, 2)}`,
      )
    }
  })
}

export const publish = (topic: string, data: string) => {
  if (!client || !client.connected) {
    logger.error(`Cannot publish to ${topic}: Client not connected`)
    return
  }

  try {
    client.publish(topic, data)
  } catch (e) {
    console.log('ERROR', e)
  }
}
