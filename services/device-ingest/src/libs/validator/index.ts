import { discoveryEventSchema, telemetryEventSchema } from '../../schemas/events'
import type { TopicPayload, TopicPrefix } from '../../contract/events'
import { z, type ZodType } from 'zod'
discoveryEventSchema

const TOPIC_PREFIX_SCHEMA_MAP = {
  'home-on/discovery/': discoveryEventSchema,
  'home-on/commands/': discoveryEventSchema, //fixme
  'home-on/telemetry/': telemetryEventSchema,
} as const satisfies Record<TopicPrefix, ZodType>

export const validateBaseTopicEvent = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  payload: unknown,
): TopicPayload<TPrefix> =>
  TOPIC_PREFIX_SCHEMA_MAP[topicPrefix].parse(payload) as TopicPayload<TPrefix>
