/** a link found in a markdown file, with the quote that backs it if the link has one */
export type Source = { url: string; quote?: string; line: number }

export type GithubFile = {
  owner: string
  repo: string
  ref: string
  path: string
  startLine?: number
  endLine?: number
}

// [1]: https://example.com 'Source title: “quote”', with the title in any of the three
// CommonMark delimiters
const REFERENCE_DEFINITION =
  /^\s*\[[^\]]+\]:\s*<?(https?:\/\/[^\s>]+)>?(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/
const INLINE_LINK = /\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)/g
const CURLY_QUOTED = /“([^”]+)”/
const BLOB_URL =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^#?]+)(?:#L(\d+)(?:-L(\d+))?)?$/
const FULL_SHA = /^[0-9a-f]{40}$/

// a title written as `Source title: “quote”` carries the quote in curly quotes; any other title
// is taken to be the quote itself
const quoteFromTitle = (title: string | undefined) => {
  if (!title) {
    return undefined
  }
  return CURLY_QUOTED.exec(title)?.[1] ?? title
}

/** collects every http(s) link in a markdown file, both reference definitions and inline links */
export const extractSources = (markdown: string): Source[] =>
  markdown.split('\n').flatMap((text, index) => {
    const line = index + 1
    const definition = REFERENCE_DEFINITION.exec(text)
    if (definition) {
      const [, url, ...titles] = definition
      return [{ url, quote: quoteFromTitle(titles.find((title) => title !== undefined)), line }]
    }
    return [...text.matchAll(INLINE_LINK)].map(([, url, title]) => ({
      url,
      quote: quoteFromTitle(title),
      line,
    }))
  })

/** splits a GitHub file link into its parts, or returns undefined for any other URL */
export const parseGithubFile = (url: string): GithubFile | undefined => {
  const match = BLOB_URL.exec(url)
  if (!match) {
    return undefined
  }
  const [, owner, repo, ref, path, start, end] = match
  const startLine = start ? Number(start) : undefined
  return {
    owner,
    repo,
    ref,
    path: decodeURIComponent(path),
    startLine,
    endLine: end ? Number(end) : startLine,
  }
}

/** a branch name moves, so only a full commit SHA keeps a link pointing at what was cited */
export const isPinned = (ref: string) => FULL_SHA.test(ref)

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

const normalize = (text: string) =>
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const pageText = (page: string) =>
  page
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => ENTITIES[name.toLowerCase()] ?? entity)

/**
 * Checks that a quote appears on a page, ignoring markup, whitespace, case and typographic
 * quotes. A quote shortened with an ellipsis matches when every part appears on the page.
 */
export const pageContainsQuote = (page: string, quote: string) => {
  const text = normalize(pageText(page))
  return quote
    .split(/\.\.\.|…/)
    .map(normalize)
    .filter(Boolean)
    .every((part) => text.includes(part))
}
