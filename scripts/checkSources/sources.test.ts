import { describe, expect, it } from 'vitest'

import { extractSources, isPinned, pageContainsQuote, parseGithubFile } from './sources'

const SHA = 'cecd25f0a1b2c3d4e5f60718293a4b5c6d7e8f90'

describe('extractSources', () => {
  it('reads the quote from a reference definition titled "Source: “quote”"', () => {
    const markdown = "intro\n\n[1]: https://mosquitto.org/man 'Mosquitto docs: “retained messages”'"

    expect(extractSources(markdown)).toEqual([
      { url: 'https://mosquitto.org/man', quote: 'retained messages', line: 3 },
    ])
  })

  it('takes a title without curly quotes as the quote itself', () => {
    expect(extractSources('[2]: <https://a.dev/x> "the whole title"')).toEqual([
      { url: 'https://a.dev/x', quote: 'the whole title', line: 1 },
    ])
  })

  it('finds inline links and leaves their quote empty when they have no title', () => {
    const markdown = 'see [here](https://a.dev/1) and [there](https://a.dev/2 "said so")'

    expect(extractSources(markdown)).toEqual([
      { url: 'https://a.dev/1', quote: undefined, line: 1 },
      { url: 'https://a.dev/2', quote: 'said so', line: 1 },
    ])
  })

  it('ignores relative links', () => {
    expect(extractSources('[goals](../../goals.md)\n[1]: ./notes.md')).toEqual([])
  })
})

describe('parseGithubFile', () => {
  it('reads the commit, path and line range of a permalink', () => {
    expect(parseGithubFile(`https://github.com/o/r/blob/${SHA}/src/a%20b.ts#L10-L20`)).toEqual({
      owner: 'o',
      repo: 'r',
      ref: SHA,
      path: 'src/a b.ts',
      startLine: 10,
      endLine: 20,
    })
  })

  it('treats a single line as a range of one', () => {
    expect(parseGithubFile(`https://github.com/o/r/blob/${SHA}/a.ts#L7`)).toMatchObject({
      startLine: 7,
      endLine: 7,
    })
  })

  it('returns nothing for links that are not to a file', () => {
    expect(parseGithubFile('https://github.com/o/r/pull/3')).toBeUndefined()
  })
})

describe('isPinned', () => {
  it('accepts only a full commit SHA', () => {
    expect(isPinned(SHA)).toBe(true)
    expect(isPinned('cecd25f')).toBe(false)
    expect(isPinned('master')).toBe(false)
  })
})

describe('pageContainsQuote', () => {
  const page =
    '<html><script>var hidden = "retain flag"</script><p>Set the <code>retain</code> ' +
    'flag &amp; the broker&#39;s copy\n   is   replaced.</p></html>'

  it('finds a quote across markup, entities and whitespace', () => {
    expect(pageContainsQuote(page, 'set the `retain` flag & the broker’s copy is replaced')).toBe(
      true,
    )
  })

  it('matches every part of a quote shortened with an ellipsis', () => {
    expect(pageContainsQuote(page, 'Set the retain flag … is replaced')).toBe(true)
    expect(pageContainsQuote(page, 'Set the retain flag … is deleted')).toBe(false)
  })

  it('does not match text inside scripts', () => {
    expect(pageContainsQuote(page, 'var hidden')).toBe(false)
  })
})
