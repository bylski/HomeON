---
name: feature
description: Spec-driven workflow for building a HomeOn feature end to end. Researches with sources, lets the user make the architecture and contract decisions, locks a spec, builds it test first in gated slices, reviews it and opens a pull request. Use when the user runs /feature.
argument-hint: <what to build> | resume [NNN]
disable-model-invocation: true
---

# /feature

Builds one feature from a description to a pull request, with the user deciding what matters
and evidence behind every claim. You run the workflow in this session and hand the work to the
subagents in `.claude/agents/`. Subagents cannot start other subagents, so never hand the
orchestration itself to one.

## Start

- `/feature <what to build>`: start at phase 0.
- `/feature resume [NNN]`: continue a feature from its state file, as described in phase 0.

## Phases

Read a phase file when you enter that phase, and follow it to its end before moving on.

| Phase                                            | Ends when                                           |
| ------------------------------------------------ | --------------------------------------------------- |
| [0 · Preflight](phases/0-preflight.md)           | the branch, spec folder and state file exist        |
| [1 · Research](phases/1-research.md)             | `research.md` holds the four reports, sources check |
| [2 · Decisions](phases/2-decisions.md)           | the user has answered every open decision           |
| [3 · Spec lock](phases/3-spec-lock.md)           | the user approved and the spec is committed         |
| [4 · Implementation](phases/4-implementation.md) | every slice is committed with its gates green       |
| [5 · Review](phases/5-review.md)                 | a review round finds nothing, or the user decided   |
| [6 · Ship](phases/6-ship.md)                     | the PR is open and its checks pass                  |

## Rules for every phase

- The spec format is [reference/spec-template.md](reference/spec-template.md). Evidence follows
  [reference/evidence-rules.md](reference/evidence-rules.md), and who decides what follows
  [reference/decision-ownership.md](reference/decision-ownership.md).
- `CLAUDE.md` and `docs/conventions/` apply to everything you and the subagents write.
- Update the state file after every step, so a lost session can resume.
- When something comes up that is the user's to decide, stop and ask, even in the middle of a
  phase. Otherwise choose, record the choice as a default in the spec, and go on.
- Ask one question at a time, as multiple choice with the recommended option first, and explain
  any term the user may not know with a short example.
- Nothing leaves the machine without the user's approval: no push, no PR, no comment on GitHub.
- Never add a `Co-Authored-By` trailer to commits.
- Give each subagent only what its instructions ask for. Their instructions already say how to
  work and report, so do not repeat them in the prompt.
