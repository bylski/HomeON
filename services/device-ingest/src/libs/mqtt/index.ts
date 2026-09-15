import * as mqtt from 'mqtt'
import { buildLogger } from '../logger/index.js'
import type { TopicPayload, TopicPrefix } from '../../contract/events.js'
import { TOPIC_PREFIXES, type TopicPrefixesWithTypes } from '@home-on/generated'
import { validateBaseTopicEvent } from '../validator/index.js'
import { getTopicWildcardVariations } from './helpers.js'

type OnEventCallback<TPrefix extends TopicPrefix> = (
  topic: string,
  payload: TopicPayload<TPrefix>,
) => void

type StoredCallback = (topic: string, payload: any) => void

let client: mqtt.MqttClient
const subscriptionsWithCallbacks: Map<string, StoredCallback[]> = new Map()

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

  client.on('message', (topic, buffer) => {
    // we want to only allow handling of topic with supported prefixes\
    const supportedPrefix = TOPIC_PREFIXES.find((prefix) => topic.startsWith(prefix))
    if (!supportedPrefix) {
      logger.error(`Received message under unsupported topic: ${topic} - message not handled.`)
      return
    }
    const topicPrefix = topic.substring(0, supportedPrefix.length) as TopicPrefix

    // message parsing with validation
    let eventPayload
    try {
      eventPayload = JSON.parse(buffer.toString())
    } catch (e) {
      logger.error(`Error during parsing message buffer for topic ${topic}, error: ${e}`)
      return
    }
    const validPayload = validateBaseTopicEvent(topicPrefix, eventPayload)

    const possiblySubscribedTopics: string[] = [
      topic,
      ...getTopicWildcardVariations(topicPrefix, topic),
    ]

    for (const topicToCheck of possiblySubscribedTopics) {
      if (!subscriptionsWithCallbacks.has(topicToCheck)) {
        // no handlers
        continue
      }
      // if topic structure has registrated callbacks - call them
      for (const callback of subscriptionsWithCallbacks.get(topicToCheck) ?? []) {
        callback(topic, validPayload)
      }
    }
  })

  client.on('error', (error) => {
    if (error instanceof mqtt.ErrorWithReasonCode) {
      logger.info(`Topic failed with error: ${JSON.stringify(error, null, 2)}`)
    }
  })
}

export const onEvent = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  topicSuffix: string,
  callback: OnEventCallback<TPrefix>,
) => {
  if (topicPrefix.includes('+') || topicSuffix.includes('+')) {
    logger.error(`'+' Wildcard is not supported for topics`)
    return
  }

  const topic = topicPrefix + topicSuffix

  if (!subscriptionsWithCallbacks.has(topic)) {
    client.subscribe(topic)
  }
  // add new callback corresponding to the topic
  const currentCallbacks = subscriptionsWithCallbacks.get(topic) ?? []
  subscriptionsWithCallbacks.set(topic, [...currentCallbacks, callback])
}

export const publish = (topic: string, data: string) => {
  try {
    client.publish(topic, data)
  } catch (e) {
    logger.error(`Error during publishing: ${e}`)
  }
}
