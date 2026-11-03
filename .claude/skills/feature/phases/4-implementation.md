# Phase 4 · Implementation

Build the slices one by one, test first. One agent writes the tests and another the code, so the
tests describe the spec and are not written to fit the code.

## Per slice

### 1. Tests

Give `test-writer` the spec path, the slice's criteria and its scope. Check its report: every
criterion of the slice has a test at the layer the spec names, and every test fails because the
behaviour is missing. Send it back when not.

### 2. Code

Give `implementer` the spec path, the slice's scope and the test files from step 1.

### 3. Gates

Give `gate-checker` this list, in order:

- always: `pnpm lint`, `pnpm test`, `pnpm check:codegen`
- when the slice touches the database or MQTT handling: `pnpm test:integration`
- when it touches firmware: `pnpm test:firmware`

When a schema changed, check yourself that the slice added a valid and an invalid contract
fixture for the change.

On failure, send the failing output to `implementer`, or to `test-writer` when the test itself is
wrong, and run the gates again. After three failed rounds, stop and show the user what fails. An
`ENV` result is not a pass: ask the user to start Docker, or whatever is missing, and rerun.

### 4. Commit

1. Fill in the Test column of the spec for the slice's criteria.
2. Stage the slice's files by name and commit them in one commit, in the repo's style: a short
   lower-case summary. The body lists the criteria covered, the choices the implementer reported,
   and why any test that existed before the slice was changed.
3. Never add a `Co-Authored-By` trailer.
4. Tick the slice in the state file.

## Stop rules

These stop the slice and go to the user, with what was found and the options:

- a change to a contract, schema, topic, QoS or retain flag, the data model or a dependency that
  the spec does not describe
- a spec gap that only a user decision can close. Gaps in implementation details are closed by
  adding a default to the spec and noting it in the commit.
- a test that seems to contradict the spec

## Firmware snapshots

Subagents never update snapshots. When a slice must change a firmware payload, check that the
spec calls for that change, then run `pnpm test:firmware:update` yourself, read the snapshot diff
field by field, and state in the commit body which part of the spec each change comes from. A
changed field the spec does not explain falls under the stop rules.

## Before review

When every slice is committed, have `gate-checker` run every gate the feature needs on the whole
branch, plus `pnpm test:system` when the feature changes the compose files, a Dockerfile or
anything on the path that the latency requirement covers. Fix failures as above, then set the
phase to `5-review`.
