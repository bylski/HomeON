# Phase 2 · Decisions

Turn the research into a draft spec, have it criticised, then let the user make the decisions
that are theirs.

## 1. Draft

Write `docs/specs/NNN-slug/spec.md` from `reference/spec-template.md`.

- Sort every choice with `reference/decision-ownership.md`. The user's choices go under
  **Decisions**, marked `**open**`. Implementation details go under **Defaults chosen by the
  agent**.
- A decision has at least two real options, trade-offs on both sides, evidence copied from the
  research with its sources, and a recommendation with the one reason that settles it. Put the
  recommended option first.
- Each acceptance criterion is observable, names its layer from `docs/conventions/testing.md` and
  leaves its test as `—` until the test exists. Cover every requirement from `docs/goals.md` that
  the feature affects.
- Add the **Hardware check** section only when firmware changes; the virtual device covers
  everything else.
- List the open `fixme:`s the feature does not resolve under **Known gaps**.
- Run `pnpm spec:check-sources docs/specs/NNN-slug/spec.md` and resolve every failure.

## 2. Critic

Give `spec-critic` the spec path and the research path, as a draft pass. Fix every Blocking and
Should fix finding, and Minor ones where they are right. When there were Blocking findings, run
the critic once more. Findings still left after that go to the user along with the spec.

## 3. The user reads the spec

Run `pnpm spec:render docs/specs/NNN-slug/spec.md` and ask the user to read the whole
`spec.html`, giving its full path. Wait for them. Their comments may change the draft; apply them
and re-render before asking about decisions.

## 4. Questions

Ask about the open decisions **one at a time** with AskUserQuestion, in the order of the spec:

- The question names the decision and links `docs/specs/NNN-slug/spec.html#d-N`.
- The options are the spec's options with the recommended one first and marked `(Recommended)`.
  Each description holds the deciding trade-off and evidence in a line or two.
- Explain every term the user may not know with a short example, as in "retained: the broker
  keeps the last message and hands it to anyone who subscribes later".

After each answer:

1. Change the heading to `### D-N · Question — **Option** · decided by <name>`, using
   `git config user.name`, and add `Why:` with the user's reason, or "accepted the
   recommendation" when they gave none.
2. Update anything else in the spec that the answer changes, such as criteria, defaults or other
   decisions, and say what changed.
3. Re-render the HTML and update the state file.

When the user answers with something that is not one of the options, research it as far as the
evidence rules need, add it as an option and confirm it with them. When they turn a default into
a decision, add it under Decisions as **open** and ask about it in turn.

When no decision is open, set the phase to `3-spec-lock`.
