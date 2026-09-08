import { discoveryEventSchema } from '../../schemas/events'
import type { TopicPayload, TopicPrefix } from '../../types/events'
import { z, type ZodType } from 'zod'
discoveryEventSchema

const TOPIC_PREFIX_SCHEMA_MAP = {
  'home-on/discovery/': discoveryEventSchema,
  'home-on/commands/': discoveryEventSchema, //fixme
  'home-on/telemetry/': discoveryEventSchema, //fixme
} as const satisfies Record<TopicPrefix, ZodType>

export const validateBaseTopicEvent = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  payload: unknown,
): TopicPayload<TPrefix> => {
  return TOPIC_PREFIX_SCHEMA_MAP[topicPrefix].parse(
    payload,
  ) as TopicPayload<TPrefix>
}

const x = <TPrefix extends TopicPrefix>(e: TPrefix) => {
  const val = validateBaseTopicEvent('home-on/commands/', {} as any)
}
