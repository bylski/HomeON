# Phase 6 · Ship

Get the user's approval, open the pull request and see CI through. Pushing and opening a PR are
public, so nothing here happens without the user's go.

## 1. Approval

Show the user:

- what was built, in a few lines, and the acceptance criteria with their tests
- the review outcome, including findings judged wrong and why
- the hardware check from the spec, when there is one. The user does it and reports the result.

Ask for approval to push and open the PR. When the user wants changes, go back to the phase they
belong to.

## 2. Pull request

1. `git push -u origin feature/NNN-slug`.
2. `gh pr create --base master` with a title in the repo's commit style and this body:
   - a link to the spec on the branch, and the problem in one or two sentences
   - the decisions, one line each, linking to their spec section
   - the acceptance criteria table with each test
   - the gates that ran and their results, in one line each
   - the review rounds and any findings judged wrong
   - the hardware check result, when there is one

   Screenshots, logs and measurements go in the PR body, never in the repo.

3. Set the spec's status line to `Status: implemented · PR: #<n> · <today>`, then commit and
   push it.

## 3. CI

Run `gh pr checks --watch`. When a check fails, read its log with `gh run view <id> --log-failed`,
fix the cause, run the local gates, commit and push, then watch again. When the failure comes
from CI itself rather than the feature, such as a workflow that has never run on GitHub before,
show it to the user instead of changing the workflow on your own.

When the checks pass, give the user the PR link. The user merges. Set the phase in the state file
to `done`.
