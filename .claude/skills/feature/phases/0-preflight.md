# Phase 0 · Preflight

Make sure the work can run unattended later: the tools the gates need are there, the base is
green, and the feature has a branch, a number and a state file.

## 1. Tools

Run these yourself; they are quick:

- `docker info`: Docker is running. Integration and system tests need it.
- `pio --version`: PlatformIO is installed. Firmware tests need it.
- `gh auth status`: GitHub CLI is logged in. Shipping needs it.

When one is missing, tell the user what it blocks and ask whether to fix it now or go on without
it. Going on is fine for a tool the feature will clearly never need (no firmware change, no
PlatformIO). Record the answer in the state file.

## 2. Branch

- The working tree must be clean. If it is not, ask the user what to do with the changes.
- `git fetch origin`, then create `feature/NNN-slug` from `origin/master`. Work in the current
  checkout unless the user asks for a worktree.

## 3. Baseline

Run `pnpm install --frozen-lockfile`, then have `gate-checker` run `pnpm lint` and `pnpm test` on
the fresh branch. A failure here was not caused by the feature: show it to the user and stop, so a broken
base is not mistaken for a broken slice later.

## 4. Number and state

- `NNN` is one more than the highest number in `docs/specs/`, zero-padded to three digits. The
  slug is a few kebab-case words from the feature name.
- Create `docs/specs/NNN-slug/.state.md` in the format below. It is gitignored. Update it at the
  end of every step in every phase, so `/feature resume` can pick up after a lost session.

```markdown
# NNN-slug

Phase: 1-research
Branch: feature/NNN-slug
Base: <full SHA of origin/master when the branch was made>
Updated: YYYY-MM-DD HH:MM

## Notes

- Docker: ok · PlatformIO: missing, user said the feature has no firmware · gh: ok

## Slices

1. [ ] Slice name: AC-1, AC-2
```

## Resuming

For `/feature resume [NNN]`, read the state file (the newest one when no number is given), check
out its branch and check that `git log` matches what the state file says was committed. Tell the
user the phase and the next step, then continue from that phase file. Work that was not committed
when the session ended is in the working tree; check `git status` and the state notes before
deciding whether to keep it.
