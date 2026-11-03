# Phase 1 · Research

Find out what the feature has to fit into, what the options are and how it can fail, with a
source for every claim. Research answers questions; it does not make decisions.

## 1. Briefs

Send all four briefs in **one message**, so the agents run in parallel. Each brief gives the
feature as the user described it, the question, the base SHA from the state file and the GitHub
repository URL (`git remote get-url origin`). The agents' own instructions cover how to research
and how to report, so do not repeat them.

1. `researcher-codebase`, **existing code and conventions:** what the feature touches, the
   patterns it must follow, and every open `fixme:` in that code.
2. `researcher-external`, **solutions and tools:** how others solve this, and which libraries or
   tools fit the stack and the Pi.
3. `researcher-external`, **failure modes:** what happens on MQTT reconnects and duplicate or
   out-of-order messages, retained messages left behind, restarts of the broker or database, the
   Pi's RAM and SD card, and the latency requirement.
4. `researcher-codebase`, **test strategy:** which test layer covers each behaviour, which
   existing tests and setup to build on, and what is hard to test.

Name the parts of the feature each brief should focus on. Leave out a brief only when it clearly
cannot apply, for example external solutions for a pure refactor, and note the reason in the state
file.

## 2. Collect

- Write the four reports into `docs/specs/NNN-slug/research.md` (gitignored), one section per
  brief, unchanged apart from merging duplicate source numbers.
- Run `pnpm spec:check-sources docs/specs/NNN-slug/research.md` and handle the results as
  `reference/evidence-rules.md` describes. Mark a claim whose source fails as an assumption, or
  drop it.
- When reports contradict each other, check the source yourself and note which one holds.

## 3. Gaps

When the research shows the feature is unclear or much bigger than the user expects, ask the user
before drafting the spec. Gather other open questions for the decisions phase instead of asking
them now.

Set the phase in the state file to `2-decisions`.
