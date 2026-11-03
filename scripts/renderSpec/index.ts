import fs from 'node:fs'
import path from 'node:path'

import { buildPanels, type Panel } from './panels'

const specsDir = path.resolve(__dirname, '../../docs/specs')
const pageTemplate = fs.readFileSync(path.join(__dirname, 'page.html'), 'utf-8')

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const renderSidebar = (title: string, status: string, panels: Panel[]) => {
  const openCount = panels.filter((panel) => panel.open).length
  const statusWord = status
    .split('·')[0]
    .replace(/^Status:\s*/i, '')
    .trim()
  const chip = [statusWord, openCount ? `${openCount} open` : ''].filter(Boolean).join(' · ')
  let group = ''
  const links = panels
    .map((panel) => {
      const heading =
        panel.group !== group ? `<div class="group">${(group = panel.group)}</div>` : ''
      const dot =
        panel.group === 'Decisions' ? `<span class="dot${panel.open ? ' open' : ''}"></span>` : ''
      const meta = panel.meta ? `<span class="meta">${panel.meta}</span>` : ''
      return `${heading}<a href="#${panel.id}" data-id="${panel.id}">${dot}${escapeHtml(panel.label)}${meta}</a>`
    })
    .join('')
  return `<div class="spec-title">${escapeHtml(title)}</div>${
    chip ? `<span class="chip${openCount ? ' open' : ''}">${escapeHtml(chip)}</span>` : ''
  }<nav>${links}</nav>`
}

const renderPanels = (panels: Panel[]) =>
  panels
    .map((panel, index) => {
      const previous = panels[index - 1]
      const next = panels[index + 1]
      const pager = `<div class="pager">${
        previous ? `<a href="#${previous.id}">← ${escapeHtml(previous.label)}</a>` : '<span></span>'
      }${next ? `<a href="#${next.id}">${escapeHtml(next.label)} →</a>` : ''}</div>`
      return `<section class="panel" id="p-${panel.id}">${panel.html}${pager}</section>`
    })
    .join('\n')

const renderSpec = (specPath: string) => {
  const markdown = fs.readFileSync(specPath, 'utf-8')
  const { title, status, panels } = buildPanels(markdown, path.basename(path.dirname(specPath)))

  // replacer functions, because a plain replacement string treats `$&` and similar specially
  const html = pageTemplate
    .replace('{{title}}', () => escapeHtml(title))
    .replace('{{sidebar}}', () => renderSidebar(title, status, panels))
    .replace('{{panels}}', () => renderPanels(panels))

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
