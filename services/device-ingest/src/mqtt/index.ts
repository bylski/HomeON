import * as mqtt from 'mqtt'
import type { TopicPayload, TopicPrefix } from '../../contract/events.js'
import { TOPIC_PREFIXES } from '@home-on/generated/events'
import { getTopicWildcardVariations } from './helpers.js'
import { validateBaseTopicEvent } from '../../contract/validation.js'
import { buildLogger } from '@home-on/logger/index'

type OnEventCallback<TPrefix extends TopicPrefix> = (
  topic: string,
  payload: TopicPayload<TPrefix>,
) => void | Promise<void>

/** callbacks of all prefixes share one map, so their payload types are erased to the union */
type StoredCallback = OnEventCallback<TopicPrefix>

type DeliveryRule = { qos: 0 | 1; retain: boolean }

/** see docs/conventions/mqtt.md (delivery rules) - commands use QoS 1, so they must be idempotent */
const DELIVERY_RULES = {
  'home-on/v1/discovery/': { qos: 0, retain: true },
  'home-on/v1/telemetry/': { qos: 0, retain: false },
  'home-on/v1/commands/': { qos: 1, retain: false },
} as const satisfies Record<TopicPrefix, DeliveryRule>

let client: mqtt.MqttClient
const subscriptionsWithCallbacks: Map<string, StoredCallback[]> = new Map()

const logger = buildLogger('[MQTT]')

const runCallback = async (
  callback: StoredCallback,
  topic: string,
  payload: TopicPayload<TopicPrefix>,
) => {
  try {
    await callback(topic, payload)
  } catch (e) {
    logger.error(`Error while handling message for topic ${topic}: ${e}`)
  }
}

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
    let validPayload
    try {
      validPayload = validateBaseTopicEvent(topicPrefix, eventPayload)
    } catch (e) {
      logger.error(`Invalid payload for topic ${topic} - message not handled, error: ${e}`)
      return
    }

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
        void runCallback(callback, topic, validPayload)
      }
    }
  })

  client.on('error', (error) => {
    if (error instanceof mqtt.ErrorWithReasonCode) {
      logger.info(`Topic failed with error: ${JSON.stringify(error, null, 2)}`)
    }
  })
}

/** Closes the broker connection and forgets all subscriptions, so `setup()` can run again. */
export const disconnect = async () => {
  subscriptionsWithCallbacks.clear()
  await client?.endAsync()
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
    client.subscribe(topic, { qos: DELIVERY_RULES[topicPrefix].qos })
  }
  // add new callback corresponding to the topic
  const currentCallbacks = subscriptionsWithCallbacks.get(topic) ?? []
  subscriptionsWithCallbacks.set(topic, [...currentCallbacks, callback as StoredCallback])
}

/** Publishes event under `topicPrefix + topicSuffix` with the delivery rules of its event type. */
export const publish = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  topicSuffix: string,
  payload: TopicPayload<TPrefix>,
) => {
  try {
    client.publish(topicPrefix + topicSuffix, JSON.stringify(payload), DELIVERY_RULES[topicPrefix])
  } catch (e) {
    logger.error(`Error during publishing: ${e}`)
  }
}
