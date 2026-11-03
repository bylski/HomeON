import { describe, expect, it } from 'vitest'

import { buildPanels } from './panels'

const SPEC = `# 001 · Telemetry storage

Status: draft · PR: — · 2026-11-03

## Problem

Readings are dropped.

## Scope

In: store readings.

## Decisions

### D-1 · How long to keep readings — **open**

| Option          | For    | Against      |
| --------------- | ------ | ------------ |
| A. 30 days, raw | simple | disk [1]     |
| B. 7 days, raw  | small  | less history |

Recommendation: B, because it is small.

### D-2 · Where readings go — **Same database** · decided by Patryk

| Option           | For      | Against       |
| ---------------- | -------- | ------------- |
| A. Same database | no infra | shared load   |
| B. InfluxDB      | built in | new container |

Why: keeps the stack small.

## Acceptance criteria

| ID   | Criterion | Layer | Test         |
| ---- | --------- | ----- | ------------ |
| AC-1 | stored    | unit  | \`'stores it'\` |
| AC-2 | rejected  | unit  | —            |

## Known gaps

- QoS 0 loses readings during restarts.

[1]: https://example.com/disk 'Disk docs: “writes wear the card”'
`

const panelsOf = (markdown: string) => buildPanels(markdown, 'fallback').panels

describe('buildPanels', () => {
  it('puts problem and scope in one overview panel, then one panel per decision and section', () => {
    expect(panelsOf(SPEC).map(({ id, group }) => `${group}:${id}`)).toEqual([
      'Overview:overview',
      'Decisions:d-1',
      'Decisions:d-2',
      'Details:acceptance-criteria',
      'Details:known-gaps',
      'Details:sources',
    ])
  })

  it('reads the title and status line', () => {
    expect(buildPanels(SPEC, 'fallback')).toMatchObject({
      title: '001 · Telemetry storage',
      status: 'Status: draft · PR: — · 2026-11-03',
    })
  })

  it('marks only undecided decisions as open', () => {
    const [d1, d2] = panelsOf(SPEC).filter((panel) => panel.group === 'Decisions')

    expect(d1).toMatchObject({ label: 'D-1 · How long to keep readings', open: true })
    expect(d2).toMatchObject({ label: 'D-2 · Where readings go', open: false })
  })

  it('highlights the option the recommendation names, not the first one', () => {
    const html = panelsOf(SPEC).find((panel) => panel.id === 'd-1')!.html

    expect(html).toMatch(/option recommended">.*?<b>7 days, raw<\/b>/s)
    expect(html).not.toMatch(/option recommended">.*?<b>30 days, raw<\/b>/s)
  })

  it('highlights the chosen option of a decided decision and names who decided', () => {
    const html = panelsOf(SPEC).find((panel) => panel.id === 'd-2')!.html

    expect(html).toMatch(/option chosen">.*?<b>Same database<\/b>/s)
    expect(html).toContain('by Patryk')
    expect(html).not.toContain('recommended')
  })

  it('counts criteria that have a test, and list items elsewhere', () => {
    const meta = Object.fromEntries(panelsOf(SPEC).map((panel) => [panel.id, panel.meta]))

    expect(meta['acceptance-criteria']).toBe('1/2')
    expect(meta['known-gaps']).toBe('1')
    expect(meta.sources).toBe('1')
  })

  it('renders citations as superscript links that carry the quote', () => {
    const html = panelsOf(SPEC).find((panel) => panel.id === 'd-1')!.html

    expect(html).toContain(
      '<a class="ref" href="https://example.com/disk" target="_blank" title="Disk docs: “writes wear the card”">[1]</a>',
    )
  })

  it('falls back to the folder name when the spec has no title, without inventing a status', () => {
    expect(buildPanels('## Problem\n\nx', 'fallback')).toMatchObject({
      title: 'fallback',
      status: '',
    })
  })
})
