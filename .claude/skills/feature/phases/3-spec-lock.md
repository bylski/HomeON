# Phase 3 · Spec lock

Freeze what will be built. After this the implementation follows the spec, and changing a user's
decision means asking again.

## 1. Final critic pass

Give `spec-critic` the spec path as a final pass, then fix its findings as in the decisions
phase. Run `pnpm spec:check-sources` on the spec once more.

## 2. Slices

Split the work into vertical slices, usually 3 to 6. A vertical slice cuts through every layer it
needs (schema, handler, service, repository, test) and leaves the feature working a bit further,
instead of building one layer at a time. Every slice:

- covers one or more acceptance criteria, and every criterion is covered by a slice
- ends with all gates green, so it can be its own commit
- builds only on earlier slices

Write the slices into the state file. They are a plan for building, not part of the spec.

## 3. Approval

Show the user a short summary of the decisions, the criteria and the slice plan, and ask for
approval. On approval:

1. Set the status line to `Status: locked · PR: — · <today>`.
2. Commit only the spec: `add spec NNN-slug`.
3. Set the phase in the state file to `4-implementation`.

When the user asks for changes, make them and go back to the critic pass.
