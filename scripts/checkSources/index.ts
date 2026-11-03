import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {
  extractSources,
  isPinned,
  pageContainsQuote,
  parseGithubFile,
  type Source,
} from './sources'

const specsDir = path.resolve(__dirname, '../../docs/specs')
const CHECKED_FILES = ['spec.md', 'research.md']
const FETCH_TIMEOUT_MS = 15_000

type Verdict = { level: 'fail' | 'warn'; reason: string }

const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })

// owner/repo of this repository, from either an https or an ssh remote
const ownRepo = (() => {
  const remote = git('remote', 'get-url', 'origin').trim()
  const match = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote)
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : undefined
})()

/** a permalink into this repository is checked against git, without going over the network */
const checkOwnFile = (ref: string, filePath: string, endLine?: number): Verdict | undefined => {
  if (!isPinned(ref)) {
    return { level: 'fail', reason: `pinned to "${ref}" instead of a full commit SHA` }
  }
  let content: string
  try {
    content = git('show', `${ref}:${filePath}`)
  } catch {
    return { level: 'fail', reason: `${filePath} does not exist at ${ref.slice(0, 7)}` }
  }
  const lineCount = content.split('\n').length
  if (endLine && endLine > lineCount) {
    return { level: 'fail', reason: `line ${endLine} is past the end of ${filePath}` }
  }
  // GitHub only serves commits that were pushed, so an unpushed SHA is a dead link for readers
  if (!git('branch', '-r', '--contains', ref).trim()) {
    return { level: 'fail', reason: `commit ${ref.slice(0, 7)} is not on any remote branch` }
  }
  return undefined
}

const fetchPage = async (url: string) => {
  // a file's raw content holds the text to quote; its github.com page is rendered by scripts
  const file = parseGithubFile(url)
  const fetchUrl = file
    ? `https://raw.githubusercontent.com/${file.owner}/${file.repo}/${file.ref}/${file.path}`
    : url
  return fetch(fetchUrl, {
    headers: { 'user-agent': 'homeon-check-sources' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
}

const checkExternal = async ({ url, quote }: Source): Promise<Verdict | undefined> => {
  const file = parseGithubFile(url)
  if (file && !isPinned(file.ref)) {
    return { level: 'fail', reason: `GitHub link pinned to "${file.ref}" instead of a commit SHA` }
  }
  let response: Response
  try {
    response = await fetchPage(url)
  } catch (e) {
    return { level: 'warn', reason: `could not reach the page (${(e as Error).message})` }
  }
  if (response.status === 404 || response.status === 410) {
    return { level: 'fail', reason: `page not found (HTTP ${response.status})` }
  }
  if (!response.ok) {
    // sites behind bot protection answer 403 or 429 to scripts while working in a browser
    return { level: 'warn', reason: `could not verify (HTTP ${response.status})` }
  }
  if (!quote) {
    return { level: 'warn', reason: 'no quote; an external source needs one unless it is a link' }
  }
  if (!pageContainsQuote(await response.text(), quote)) {
    return { level: 'warn', reason: 'quote not found on the page (it may be rendered by scripts)' }
  }
  return undefined
}

const checkSource = (source: Source): Promise<Verdict | undefined> => {
  const file = parseGithubFile(source.url)
  if (file && `${file.owner}/${file.repo}`.toLowerCase() === ownRepo) {
    return Promise.resolve(checkOwnFile(file.ref, file.path, file.endLine))
  }
  return checkExternal(source)
}

const defaultFiles = () =>
  fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => CHECKED_FILES.map((name) => path.join(specsDir, entry.name, name)))
    .filter((file) => fs.existsSync(file))

/**
 * Checks that the sources cited in specs and research notes exist: links into this repository are
 * pinned to a pushed commit and point at real lines, external pages load and contain their quote.
 * Fails on dead or unpinned links; prints warnings for what a script can't verify, which need a
 * look by hand. Without arguments it checks every spec and research file in docs/specs.
 */
const run = async () => {
  const passedPaths = process.argv.slice(2)
  const files = passedPaths.length ? passedPaths.map((file) => path.resolve(file)) : defaultFiles()
  // the same page is often cited many times, so each URL is checked once
  const verdicts = new Map<string, Promise<Verdict | undefined>>()

  const results = await Promise.all(
    files.flatMap((file) =>
      extractSources(fs.readFileSync(file, 'utf-8')).map(async (source) => {
        const key = `${source.url} ${source.quote ?? ''}`
        if (!verdicts.has(key)) {
          verdicts.set(key, checkSource(source))
        }
        return { file, source, verdict: await verdicts.get(key) }
      }),
    ),
  )

  let failures = 0
  results.forEach(({ file, source, verdict }) => {
    if (!verdict) {
      return
    }
    failures += verdict.level === 'fail' ? 1 : 0
    const location = `${path.relative(process.cwd(), file)}:${source.line}`
    console.log(
      `${verdict.level.toUpperCase()}  ${location}  ${source.url}\n      ${verdict.reason}`,
    )
  })
  console.log(`Checked ${results.length} links in ${files.length} files, ${failures} failed.`)
  if (failures) {
    process.exit(1)
  }
}

void run()
