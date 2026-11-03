import { Marked, Parser, type Token, type Tokens } from 'marked'

export type PanelGroup = 'Overview' | 'Decisions' | 'Details'

/** one page of the rendered spec, shown on its own when its sidebar entry is selected */
export type Panel = {
  id: string
  group: PanelGroup
  label: string
  open?: boolean
  meta?: string
  html: string
}

export type RenderedSpec = { title: string; status: string; panels: Panel[] }

// "D-2 · Question — **Option** · decided by Name", or "— **open**" while undecided
const DECISION_HEADING =
  /^(D-\d+)\s*·\s*(.+?)\s*—\s*\*\*(.+?)\*\*(?:\s*·\s*decided by\s+(.+?))?\s*$/i
const OPTION_NAME = /^([A-Z])\.\s*(.+)$/
const RECOMMENDATION = /^Recommendation:\s*([A-Z])\b/
const OVERVIEW_SECTIONS = ['problem', 'scope']

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

const marked = new Marked({
  renderer: {
    // numbered reference links are citations: a superscript with the quoted source as tooltip
    link({ href, title, text }) {
      const attrs = `href="${escapeHtml(href)}" target="_blank"${title ? ` title="${escapeHtml(title)}"` : ''}`
      return /^\d+$/.test(text)
        ? `<a class="ref" ${attrs}>[${text}]</a>`
        : `<a ${attrs}>${text}</a>`
    },
  },
})
const parser = new Parser(marked.defaults)
const inline = (tokens: Token[]) => parser.parseInline(tokens)
const block = (tokens: Token[]) => marked.parser(tokens)

type Decision = { id: string; question: string; answer?: string; by?: string }

const parseDecision = (heading: string): Decision | undefined => {
  const match = DECISION_HEADING.exec(heading)
  if (!match) {
    return undefined
  }
  const [, id, question, answer, by] = match
  return answer.toLowerCase() === 'open' ? { id, question } : { id, question, answer, by }
}

const isOptionsTable = (token: Token): token is Tokens.Table =>
  token.type === 'table' &&
  (token as Tokens.Table).header.map((cell) => cell.text.toLowerCase()).join() ===
    'option,for,against'

const renderOptions = (table: Tokens.Table, decision: Decision, recommended?: string) =>
  `<div class="options">${table.rows
    .map(([name, pro, con]) => {
      const [, letter = '', optionName = name.text] = OPTION_NAME.exec(name.text) ?? []
      const chosen = decision.answer?.toLowerCase() === optionName.toLowerCase()
      const isRecommended = !decision.answer && letter === recommended
      const tag = chosen ? 'chosen' : isRecommended ? 'recommended' : ''
      return `<div class="option ${tag}"><span class="letter">${letter}</span>
        <div><b>${escapeHtml(optionName)}</b>${tag ? `<span class="tag">${tag}</span>` : ''}</div>
        <div class="pro">${inline(pro.tokens)}</div><div class="con">${inline(con.tokens)}</div></div>`
    })
    .join('')}</div>`

const renderDecision = (decision: Decision, tokens: Token[]) => {
  const recommended = tokens
    .filter((token): token is Tokens.Paragraph => token.type === 'paragraph')
    .map((token) => RECOMMENDATION.exec(token.text)?.[1])
    .find(Boolean)
  const status = decision.answer
    ? `<div class="status">Decided: <b>${escapeHtml(decision.answer)}</b>${decision.by ? ` · by ${escapeHtml(decision.by)}` : ''}</div>`
    : '<div class="status open">Open: needs your answer</div>'
  const body = tokens
    .map((token) => {
      if (isOptionsTable(token)) {
        return renderOptions(token, decision, recommended)
      }
      if (token.type === 'paragraph' && /^(Recommendation|Why):/.test(token.text)) {
        const open = token.text.startsWith('Recommendation') && !decision.answer
        return `<div class="callout${open ? ' open' : ''}">${inline((token as Tokens.Paragraph).tokens)}</div>`
      }
      return block([token])
    })
    .join('')
  return `<h1>${decision.id} · ${inline(marked.Lexer.lexInline(decision.question))}</h1>${status}${body}`
}

// a criteria table counts its rows that name a test; a list counts its items
const sectionMeta = (tokens: Token[]) => {
  const table = tokens.find((token): token is Tokens.Table => token.type === 'table')
  const testColumn = table?.header.findIndex((cell) => cell.text.toLowerCase() === 'test') ?? -1
  if (table && testColumn >= 0) {
    const tested = table.rows.filter((row) => !/^[—–-]?$/.test(row[testColumn].text.trim()))
    return `${tested.length}/${table.rows.length}`
  }
  const list = tokens.find((token): token is Tokens.List => token.type === 'list')
  return list ? String(list.items.length) : undefined
}

const renderSources = (definitions: Tokens.Def[]) =>
  `<h1>Sources</h1><table>${definitions
    .map(({ tag, href, title }) => {
      const [, name = href, quote] = /^(.*?):\s*“(.+)”$/.exec(title ?? '') ?? []
      return `<tr><td>[${escapeHtml(tag)}]</td><td><a href="${escapeHtml(href)}" target="_blank">${escapeHtml(title ? name : href)}</a>${
        quote ? `<br><span class="muted">“${escapeHtml(quote)}”</span>` : ''
      }</td></tr>`
    })
    .join('')}</table>`

/**
 * Splits a spec into sidebar panels: Problem and Scope form the overview, every decision gets its
 * own panel with the id `d-N` (so chat questions can link to it), and every other section is a
 * detail panel. Source definitions are collected into a Sources panel.
 */
export const buildPanels = (markdown: string, fallbackTitle: string): RenderedSpec => {
  const tokens = marked.lexer(markdown)
  const titleIndex = tokens.findIndex((token) => token.type === 'heading' && token.depth === 1)
  const title = titleIndex >= 0 ? (tokens[titleIndex] as Tokens.Heading).text : fallbackTitle
  // the status line is the paragraph directly under the title, never one from a later section
  const afterTitle = tokens.slice(titleIndex + 1).find((token) => token.type !== 'space')
  const statusToken =
    titleIndex >= 0 && afterTitle?.type === 'paragraph'
      ? (afterTitle as Tokens.Paragraph)
      : undefined
  const status = statusToken?.text ?? ''

  type Section = {
    heading: string
    tokens: Token[]
    decisions: { heading: string; tokens: Token[] }[]
  }
  const sections: Section[] = []
  tokens.forEach((token) => {
    if (token.type === 'heading' && token.depth === 2) {
      sections.push({ heading: token.text, tokens: [], decisions: [] })
      return
    }
    const section = sections.at(-1)
    if (!section || token.type === 'def' || token.type === 'space') {
      return
    }
    const decisions = section.decisions
    if (token.type === 'heading' && token.depth === 3 && parseDecision(token.text)) {
      decisions.push({ heading: token.text, tokens: [] })
    } else if (decisions.length) {
      decisions[decisions.length - 1].tokens.push(token)
    } else {
      section.tokens.push(token)
    }
  })

  const overview = sections.filter(({ heading }) =>
    OVERVIEW_SECTIONS.includes(heading.toLowerCase()),
  )
  const panels: Panel[] = [
    {
      id: 'overview',
      group: 'Overview',
      label: 'Problem & scope',
      html: `<h1>${escapeHtml(title)}</h1><p class="lead">${statusToken ? inline(statusToken.tokens) : ''}</p>${overview
        .map(({ heading, tokens }) => `<h2>${escapeHtml(heading)}</h2>${block(tokens)}`)
        .join('')}`,
    },
  ]
  sections
    .filter(({ heading }) => !OVERVIEW_SECTIONS.includes(heading.toLowerCase()))
    .forEach((section) => {
      section.decisions.forEach(({ heading, tokens }) => {
        const decision = parseDecision(heading) as Decision
        panels.push({
          id: decision.id.toLowerCase(),
          group: 'Decisions',
          label: `${decision.id} · ${decision.question.replace(/\*\*/g, '')}`,
          open: !decision.answer,
          html: renderDecision(decision, tokens),
        })
      })
      if (!section.decisions.length || section.tokens.length) {
        panels.push({
          id: slugify(section.heading),
          group: 'Details',
          label: section.heading,
          meta: sectionMeta(section.tokens),
          html: `<h1>${escapeHtml(section.heading)}</h1>${block(section.tokens)}`,
        })
      }
    })

  const definitions = tokens.filter((token): token is Tokens.Def => token.type === 'def')
  if (definitions.length) {
    panels.push({
      id: 'sources',
      group: 'Details',
      label: 'Sources',
      meta: String(definitions.length),
      html: renderSources(definitions),
    })
  }
  return { title, status, panels }
}
