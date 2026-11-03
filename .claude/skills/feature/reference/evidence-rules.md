# Evidence rules

Every factual claim in research notes and specs has a source a reader can check. A claim that
has none is marked as an assumption. The rules exist so the user can trust a recommendation
without redoing the research.

## What counts as a source

| Claim about                    | Source                                                                 |
| ------------------------------ | ---------------------------------------------------------------------- |
| code or docs in this repo      | GitHub permalink pinned to a full commit SHA, with a line range        |
| anything outside this repo     | URL plus a one-line quote copied verbatim from the page                |
| performance, size, memory, etc | the measured number plus the method: what ran, where, how many samples |

- **Permalinks** pin to a commit that is already on GitHub, normally the base commit of the
  feature branch, because a commit that was never pushed is a dead link for every reader. Cite
  lines with `#L10-L20`.
- **Quotes** come from a page that was actually fetched, never from memory. Shorten a long quote
  with `…`, but do not reword it. GitHub links outside this repo are pinned to a full commit SHA
  too, since a branch moves and a tag can be moved. Prefer primary sources (official docs, the
  project's own repo, maintainers' comments) and note the version or date the source applies to.
- **Measurements** say where they ran. A number from a development PC says nothing about the
  Raspberry Pi; label it as such, and measure on the Pi or treat the Pi figure as an assumption.

## Writing sources down

Use reference links, with the quote in the title in the template's format:

```markdown
A retained message is replaced by the next one on the same topic [1].

[1]: https://example.com/page 'Source title: “the verbatim quote”'
```

Permalinks into this repo need no quote; the lines they point at are the evidence. A measured
number is written inline: `p95 1.2 s over 200 readings, virtual device to REST, dev PC (Docker)`.

## Assumptions

Write `Assumption:` before a claim that has no source, followed by what would confirm it. A
recommendation that rests on an assumption says so, so the user can decide whether to check it
first. An honest assumption is better than a weak source.

## Checking sources

`pnpm spec:check-sources [file]` checks every link in a spec or research file. With no argument it
checks all of `docs/specs/`.

- **FAIL:** the page is gone, a link is not pinned to a full SHA, a cited file or line does not
  exist at that commit, or the commit is not pushed. Fix the link or drop the claim.
- **WARN:** the script could not verify the source, because the site blocks scripts, the page is
  rendered by JavaScript, or an external link has no quote. Open the page (WebFetch) and confirm
  the quote by hand. If it is not there, fix or drop the claim.

The script checks that sources exist and contain their quote. Whether a source supports the claim
is for `spec-critic` and the user to judge.
