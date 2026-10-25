import {
  commandEventSchema,
  discoveryEventSchema,
  telemetryEventSchema,
} from '../src/schemas/events.js'
import type { TopicPayload, TopicPrefix } from './events.js'
import type { ZodType } from 'zod'

const TOPIC_PREFIX_SCHEMA_MAP = {
  'home-on/v1/discovery/': discoveryEventSchema,
  'home-on/v1/commands/': commandEventSchema,
  'home-on/v1/telemetry/': telemetryEventSchema,
} as const satisfies Record<TopicPrefix, ZodType>

export const validateBaseTopicEvent = <TPrefix extends TopicPrefix>(
  topicPrefix: TPrefix,
  payload: unknown,
): TopicPayload<TPrefix> =>
  TOPIC_PREFIX_SCHEMA_MAP[topicPrefix].parse(payload) as TopicPayload<TPrefix>
