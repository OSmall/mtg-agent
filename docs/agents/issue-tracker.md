# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations; it infers `OSmall/tomekin`
from this clone's remote.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`.
- **Read an issue**: `gh issue view <number> --comments`, including labels.
- **List issues**: `gh issue list` with the appropriate state and label filters.
- **Comment, label, or close**: use `gh issue comment`, `gh issue edit`, and `gh issue close`.

## Pull requests as a triage surface

**PRs as a request surface: no.** GitHub pull requests are not part of the triage queue. Change this flag to `yes` only
if external PRs should be treated as feature requests.

## Skill vocabulary

When a skill says to publish to the issue tracker, create a GitHub issue. When it says to fetch the relevant ticket, run
`gh issue view <number> --comments`.

## Wayfinding operations

`/wayfinder` uses one `wayfinder:map` GitHub issue as its map and child issues as tickets. Label children by type
(`wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`), assign a ticket when claimed,
and use GitHub native issue dependencies for blockers where available.
