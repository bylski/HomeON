# Phase 5 · Review

Have the branch reviewed by an agent that did not write it, and fix what it finds.

## One round

1. Give `reviewer` only the spec path and the base SHA from the state file. A fresh reviewer that
   has not seen the research or the slices judges the result the way a reader of the PR will.
2. Before fixing anything, compare the findings with the earlier rounds in the state file. When a
   finding lands in a function an earlier round already fixed, do not patch it again. Give
   `simplifier` the spec path, that function and its fix history, and ask whether the function
   should exist at all. Treat its answer as a Design finding.
3. Sort its findings:
   - **Blocking and Small:** fix them, through `implementer` for code and `test-writer` for tests,
     or directly when a fix is a line or two.
   - **Design:** replace the code with the simpler design when it keeps the spec's behaviour,
     through `implementer`, and `test-writer` for tests that assert the old internals. A Design
     finding that would change behaviour is asked like a Spec finding.
   - **Spec or contract:** ask the user, one finding at a time, like a decision. When the answer
     changes the spec, update it and say why in the commit.
   - **Wrong:** a finding that misreads the code or the spec is not fixed. Write down why in the
     state file, so the PR can mention it.
4. Run the gates from the implementation phase on what changed, then commit the fixes:
   `address review round N`.
5. Record the round and its findings in the state file.

## Ending

Start a new round with a new `reviewer` after every round that had findings. Review ends after a
round with no findings, or with only findings already judged wrong.

After three rounds that still have findings, stop and show the user what is left, with your view
of each one. The user decides whether to fix, accept or drop them.

Set the phase to `6-ship`.
