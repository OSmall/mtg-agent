# Domain Docs

How engineering skills should consume this repository's domain documentation.

## Before exploring

- Read `CONTEXT-MAP.md` at the repository root, then the context relevant to the work.
- Read ADRs in `docs/adr/` that touch the area under consideration.
- If a context or ADR directory does not exist, proceed silently. Create it only when terminology or a decision needs
  recording.

## Layout

This is a multi-context repository. `CONTEXT-MAP.md` identifies the shared and package-specific contexts. System-wide
decisions live in `docs/adr/`; package-specific decisions may live under the relevant package when needed.

## Vocabulary and ADRs

Use glossary terms as defined in the relevant `CONTEXT.md`; do not substitute terms the glossary explicitly avoids. If
an output contradicts an ADR, identify that conflict explicitly rather than silently overriding it.
