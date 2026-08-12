# Design Branches

This document captures unresolved design branches to resume later. It should stay focused on open decisions, dependencies, and recommended next areas to grill.

## Data Model Details

- Define the exact scalar metadata fields for `DeckOpportunity` and `DeckCandidate`.
- Define the Zod schemas for `DeckBuildingBrief` and `CollectionAccessPolicy`.
- Decide whether to add candidate-specific `DeckCandidateCardRole` records or fields for roles such as enabler, payoff,
  win condition, and theme card. These roles describe why a card belongs in a specific Deck Candidate and should remain
  distinct from source-backed `CardIdentityTag` data.
- Decide how to handle split cards, multi-face cards, attractions, stickers, digital cards, rebalanced cards, and other Scryfall identity edge cases.

## Application Services

- Continue evolving the structured Card Query service described in [`plans/card-query.md`](./plans/card-query.md) and
  [`ADR 0012`](./adr/0012-cql2-shaped-card-queries.md) only when concrete workflows require more query semantics.
- Separate import services, Scryfall sync services, deck-building services, query services, and render/export services.
- Decide which service outputs are structured data, Markdown, or both.
- Define expected business errors for `neverthrow` Result seams.
- Resolve the remaining implementation choices for paper-first 60-card Constructed support without changing Commander
  eligibility. See [`plans/60-card-constructed.md`](./plans/60-card-constructed.md).

## Opencode Adapter

- Continue hardening the CQL2-shaped `query_cards` Agent Tool as the primary card retrieval surface.
- Loosen the base MTG deck-builder agent workflow while keeping strict authority boundaries: no raw database MCP access,
  no arbitrary file or shell access, and only explicitly allowed Tomekin Tools.
- Forward-test `commander-deck-tuning` against real deck reviews before promoting any of its transient role reasoning to
  durable data or deterministic services. Its initial slice intentionally has no database migration, persisted role
  taxonomy, new role-analysis tool, price support, or comprehensive scenario suite.
- Forward-test Collection Opportunity discovery, fresh 60-card architecture, and 60-card tuning against the manual
  invariant corpus before promoting repeatable reasoning into portable-core Modules.
- Decide whether tools accept file paths, raw text input, or both.
- Decide how local configuration such as `TOMEKIN_DB_PATH` is exposed to tools.

## LLM Orchestration

- Decide what deterministic code owns versus what the LLM owns.
- Use Card Query and detail tools as the primary way the agent receives relevant card, tag, and collection
  context without loading excessive data into prompts.
- Define when the LLM produces durable Markdown rationale versus transient analysis.
- Define guardrails for legality, price, and rules-sensitive claims.
- Decide whether Deck Candidate evaluation should add advisory structural evidence such as curve bands, early-action
  counts, colored-source summaries, and scoped Availability findings. Keep these as evidence for agent judgment rather
  than a deterministic deck-quality score unless a validated rule is later discovered.
- Decide whether a clean post-discovery task should remain a user-visible recovery technique or be replaced by stored
  working Brief and Deck Candidate identifiers.

## Deck Opportunity Discovery

- The initial skill workflow resolves a transient shortlist from a confirmed Brief, exact Collection Location
  allow-list, bounded Card Queries, functional-plan refinement, and explicit viability blockers. It ranks up to three
  opportunities without padding and stops before construction.
- Decide which proven candidate-generation, support-density, viability, and ranking calculations move into portable core
  rather than remaining agent judgment.
- Define the structured Deck Opportunity Interface and durable repository Implementation required by the product model.
- Define structured Collection Access Policy enforcement and final Availability evaluation; current skill enforcement is
  procedural.

## Testing

- Extend the existing small ManaBox and Scryfall fixtures when new import behavior requires coverage.
- Continue testing import failure behavior, transactionality, computed Availability, generated Portable Decklists, and
  agent-facing Markdown shape.
- Define format-matrix and Copy Limit Override fixtures before implementing 60-card Constructed validation.
- Run the real-session prompts in [
  `testing/deck-building-workflow-scenarios.md`](./testing/deck-building-workflow-scenarios.md)
  before promoting skill reasoning into core Modules. Compare Sol and Terra only with the same prompt, tools, Collection
  snapshot, and reasoning effort; otherwise model conclusions are confounded.

## Recommended Next Sequence

1. Run one fresh Collection Opportunity-to-construction session and one healthy Existing Deck tuning session with Sol.
2. Review the session and logs against the manual invariants, separating methodology failures from retrieval,
   truncation, missing evidence, and model behaviour.
3. Fix the smallest evidenced skill or Card Query problem; do not add a deterministic quality engine pre-emptively.
4. Re-run the same scenario at the same reasoning effort. Compare Terra only after Sol passes.
5. Promote stable calculations into portable-core Modules only after repeated sessions show the same reasoning need.
6. Prioritize structured Collection Access Policy enforcement, durable Deck Opportunity persistence, or context
   efficiency according to the failures observed in real use.

## Post-MVP Implementation Sequence

- Complete the remaining design decisions and source research for paper-first 60-card Constructed support before
  implementation begins.
- Address Card Query completeness or performance gaps when the 60-card workflow exposes a concrete need, including
  inherited tag projections for `include.tags` and stricter validation where required.
- Continue validating the tool-bound agent's focused skills and promote repeatable, proven logic into portable-core
  Modules when their Interfaces are stable.
- Use [`testing/deck-building-workflow-scenarios.md`](./testing/deck-building-workflow-scenarios.md) for the current
  Deck Opportunity, fresh-construction, and tuning quality gate.
