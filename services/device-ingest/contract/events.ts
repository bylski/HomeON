import { TopicPrefixesWithTypes, type ComponentConfig } from '@home-on/generated/events'

export type TopicPrefix = keyof TopicPrefixesWithTypes
export type TopicPayload<T extends TopicPrefix> = TopicPrefixesWithTypes[T]

export const COMPONENT_TYPES = [
  'SENSOR',
  'SWITCH',
  'DISPLAY',
  'MOTOR',
  'SERVO',
  'LIGHT',
] as const satisfies readonly ComponentConfig['type'][]
