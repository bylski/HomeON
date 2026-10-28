import fs from 'node:fs'
import path from 'node:path'

import { Marked, parseInline } from 'marked'

const specsDir = path.resolve(__dirname, '../../docs/specs')
const pageTemplate = fs.readFileSync(path.join(__dirname, 'page.html'), 'utf-8')

// the decisions phase marks unanswered decisions as "### D-2 · Question — **open**"
const OPEN_DECISION = /\*\*open\*\*\s*$/i
const DECISION_ID = /^(D-\d+)\b/i

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

type OpenDecision = { id: string; label: string }

const renderSpec = (specPath: string) => {
  const markdown = fs.readFileSync(specPath, 'utf-8')
  const usedIds = new Set<string>()
  const openDecisions: OpenDecision[] = []

  // stable ids, so chat questions can link straight to a decision (spec.html#d-2)
  const uniqueId = (base: string) => {
    let id = base || 'section'
    for (let n = 2; usedIds.has(id); n++) {
      id = `${base}-${n}`
    }
    usedIds.add(id)
    return id
  }

  const marked = new Marked({
    renderer: {
      heading: ({ text, depth }) => {
        const decisionId = depth === 3 ? DECISION_ID.exec(text)?.[1] : undefined
        const id = uniqueId(slugify(decisionId ?? text))
        const isOpen = decisionId !== undefined && OPEN_DECISION.test(text)
        if (isOpen) {
          openDecisions.push({ id, label: decisionId })
        }
        const className = decisionId ? ` class="decision${isOpen ? ' open' : ''}"` : ''
        return `<h${depth} id="${id}"${className}>${parseInline(text)}</h${depth}>\n`
      },
    },
  })

  const body = marked.parse(markdown, { async: false })
  const title = /^# (.+)$/m.exec(markdown)?.[1] ?? path.basename(path.dirname(specPath))
  const banner = openDecisions.length
    ? `<p class="banner">Open decisions: ${openDecisions
        .map(({ id, label }) => `<a href="#${id}">${label}</a>`)
        .join(', ')}</p>`
    : ''

  // replacer functions, because a plain replacement string treats `$&` and similar specially
  const html = pageTemplate
    .replace('{{title}}', () => escapeHtml(title))
    .replace('{{banner}}', () => banner)
    .replace('{{body}}', () => body)

  const outputPath = path.join(path.dirname(specPath), 'spec.html')
  fs.writeFileSync(outputPath, html)
  console.log(`Rendered ${path.relative(process.cwd(), outputPath)}`)
}

/**
 * Renders spec.md files to a standalone spec.html next to each, for reading in the browser.
 * The markdown is the committed source of truth; the HTML is gitignored. Without arguments it
 * renders every spec in docs/specs.
 */
const run = () => {
  const passedPaths = process.argv.slice(2)
  const specPaths = passedPaths.length
    ? passedPaths.map((specPath) => path.resolve(specPath))
    : fs
        .readdirSync(specsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(specsDir, entry.name, 'spec.md'))
        .filter((specPath) => fs.existsSync(specPath))

  specPaths.forEach(renderSpec)
}

run()
