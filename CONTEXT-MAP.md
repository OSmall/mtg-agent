# Tomekin context map

Use this map to select the domain documentation relevant to a change.

## Shared context

- [`CONTEXT.md`](CONTEXT.md) is the current shared Tomekin glossary. It covers the collection-first deck-building domain
  used across the workspace.
- [`docs/adr/`](docs/adr/) contains system-wide architecture decisions.

## Package contexts

The workspace packages are `core`, `sqlite`, `cli`, and `opencode`. They currently use the shared glossary and
system-wide ADRs. Add a package-local `CONTEXT.md` and `docs/adr/` only when a package develops language or decisions
that are not shared across the workspace.
