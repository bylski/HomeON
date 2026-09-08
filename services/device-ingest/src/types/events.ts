import { TopicPrefixesWithTypes } from '@home-on/generated'

export type TopicPrefix = keyof TopicPrefixesWithTypes
export type TopicPayload<T extends TopicPrefix> = TopicPrefixesWithTypes[T]
