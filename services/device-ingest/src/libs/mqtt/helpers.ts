import type { TopicPrefix } from '../../contract/events'

/** Checks for possible multi-level wildcard (#) variations of given topic. */
export const getTopicWildcardVariations = (
  topicPrefix: TopicPrefix,
  topic: string,
) => {
  const possibleWildcardVariations: string[] = []
  const topicSuffixParts = topic.replace(topicPrefix, '').split('/')

  for (let i = 0; i < topicSuffixParts.length; i++) {
    // increasingly slice the topic from the end to get every possible shape - down to root (prefix)
    const incompleteSuffix = topicSuffixParts
      .slice(0, topicSuffixParts.length - (i + 1))
      .join('/')

    let possibleWildcardShape = topicPrefix + incompleteSuffix
    possibleWildcardShape += possibleWildcardShape.endsWith('/') ? '' : '/'
    possibleWildcardShape += '#'

    possibleWildcardVariations.push(possibleWildcardShape)
  }

  return possibleWildcardVariations
}
