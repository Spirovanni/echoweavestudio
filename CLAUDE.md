
# Claude project instructions

Use Beads for task tracking in this repository.

At the start of work:

- Read `PRD.md` (or `PROJECT_DESCRIPTION.md`) first.
- Run `bd ready` to see unblocked work.
- Before starting a bead, run `bd show <id>`.

When planning from the PRD:

- Create epics for major systems/features.
- Create child tasks for implementation, tests, docs, and deployment.
- Add dependencies with `bd dep add`.
- Put acceptance criteria in bead descriptions/notes.

During work:

- Claim tasks with `bd update <id> --claim`
- Append progress notes with `bd update <id> --append-notes="..."`
- Close completed work with `bd close <id> --reason="what changed"`

Do not use markdown TODO lists as the source of truth when Beads is available.
