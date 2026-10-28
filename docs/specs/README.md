# Specs

Every feature built with the `/feature` workflow starts from a spec in `NNN-<slug>/spec.md`. A spec
records the problem, the decisions with the options and evidence behind them, who made each one,
and the acceptance criteria with the test that covers each.

- Only `spec.md` is committed. Raw research and workflow progress stay local.
- Evidence is text: links pinned to a commit, quoted sources, measured numbers. Screenshots and
  long logs go in the pull request.
- A merged spec is a record of what was decided at the time. Only its status line changes later;
  a decision revisited by a newer feature gets a new spec that supersedes the old one.
- `pnpm spec:render` renders specs to a local `spec.html` for reading in the browser.
