# Deck-Building Workflow Rebuild

## Status

Implemented on 9 August 2026 as a skill-first proving slice; real OpenCode session validation remains pending. This
retained plan records the source corpus, adopted and rejected claims, workflow Interfaces, and promotion boundary.

## Goal

Separate three agent workflows that previously met at a Shallow Seam:

1. Collection Opportunity discovery across all supported Formats.
2. Fresh 60-card Constructed architecture from a chosen Deck Opportunity or specific Format Anchor.
3. 60-card Constructed tuning with an explicit focused-repair, rebuild-around-identity, or fresh-construction gate.

The slice intentionally adds no core Agent Tool, Brief field, SQLite migration, durable Deck Opportunity repository,
deterministic Deck Role taxonomy, deck-quality score, or larger Card Query output cap. It proves methodology before
promoting stable behaviour into portable-core Modules.

## Research Method

The user-selected sources are primary. Existing sources remain only where they fill a named gap. Claims are adopted when
they describe a durable method that Tomekin can apply with local reference and Collection data. Named cards, historical
lists, current metagame claims, and categorical claims unsupported by the broader method are rejected.

### Primary fresh-construction source

- Author: Andrew Quinn.
-
Title: [The Ultimate Introduction to Deckbuilding in Magic: How to Build a Deck in 6 Steps](https://draftsim.com/build-mtg-deck/).
- Updated: 14 May 2025.
- Classification: stable sequential method; named lists, current-Format examples, and generic numerical ranges are
  volatile or illustrative.
- Adopted: establish a real plan before card selection; let the plan constrain colors and mana; research the available
  card space; choose quantities by how often a card must appear and how multiples function; shape a plan-specific Mana
  Curve; treat the first list as a draft that needs evidence-driven iteration.
- Rejected: any named list as a timeless template; universal land ranges by archetype; a single universal curve shape;
  normal Tomekin claims of actual playtesting.

### Primary tuning source

- Author: Ben Bleiweiss.
-
Title: [Deckbuilding 101: Five Tips for Better Deckbuilding](https://magic.wizards.com/en/news/feature/deckbuilding-101-five-tips-better-deckbuilding-2006-06-05).
- Published: 5 June 2006.
- Classification: durable diagnostic principles with dated examples and one overly categorical card-type rule.
- Adopted: repair the mana base against actual spell requirements; stay close to the minimum deck size for consistency;
  focus the plan without becoming a slave to theme; ensure the deck can act across the stages its plan requires or
  survive until its expensive plays; evaluate dependency and card-disadvantage risks.
- Rejected: named historical cards and lists; the categorical claim that beneficial creature Auras are inherently wrong.
  Tomekin evaluates required board state, timing, vulnerability, payoff, and resilience instead.

### Supporting land-count source

- Author: Frank Karsten.
-
Title: [How Many Lands Do You Need in Your Deck? An Updated Analysis](https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/).
- Updated: 13 February 2025; underlying event data covers 1 July 2020 through 1 July 2022.
- Classification: quantitative starting model with explicit unexplained variation and revision-sensitive card
  classifications.
- Adopted: when inputs are reliable, use
  `19.59 + 1.90 × average nonland Mana Value - 0.28 × cheap draw/ramp count + 0.27 × companion count` as an initial
  60-card estimate; count non-mythic and mythic land/spell modal double-faced cards as 0.38 and 0.74 land respectively.
- Rejected: using the estimate as legality, a quality score, false precision, or a replacement for colored-source,
  curve, reliability, and game-plan analysis.

### Supporting card-advantage source

- Author: Reid Duke.
- Title: [The Basics of Card Advantage](https://magic.wizards.com/en/news/feature/basics-card-advantage-2015-07-13).
- Published: 13 July 2015.
- Classification: stable resource principle; named cards are illustrative.
- Adopted: distinguish net card advantage from selection or looting; account for whether the deck converts discard,
  graveyard setup, or another apparent cost into material value.

### Supporting Sideboard sources

- Author: Reid Duke.
- Titles: [The Sideboard](https://magic.wizards.com/en/news/feature/sideboard-2015-08-10) and
  [Sideboard Plans](https://magic.wizards.com/en/news/feature/sideboard-plans-2015-03-09).
- Published: 10 August and 9 March 2015.
- Classification: stable planning method; named matchups and cards are volatile.
- Adopted: create a Sideboard only from stated matchup or local-play context; identify cards in and out; preserve the
  post-board curve, mana, role coverage, and win condition; do not infer a current metagame from model memory.

## Resolved Workflow Interfaces

### Collection Opportunity discovery

- Requires a confirmed Deck Building Brief, open or seeded intent, ready reference data, and exact allowed Collection
  Location pairs.
- Reuses one positive Card Query allow-list in every Collection search.
- Uses bounded compact discovery queries, then hydrates detailed tags or physical evidence only for shortlists.
- Refines broad themes into functional plans and evaluates Format Anchor fit, Collection support, Availability,
  cohesion, Missing Card burden, power/play-experience fit, and blockers.
- Returns up to three viable opportunities without padding. The shortlist is transient and not persisted in this slice.
- Hands the selected opportunity to the appropriate Format architecture skill.

### Fresh 60-card construction

- Requires a selected Deck Opportunity or specific Format Anchor in addition to the confirmed Brief.
- Follows plan, mana feasibility, package research, quantities, curve/mana, and static-review stages in order.
- Requires evidence for early actions, card advantage, package balance, colored sources, copy counts, and the three
  weakest included nonlands.
- Makes an explicit accept-or-revise curve decision and performs a scoped final Availability recheck.
- Permits at most three complete construction/review passes.

### 60-card tuning

- Diagnoses the Existing Deck before searching and recommends focused repair, rebuild around identity, or fresh
  construction.
- Requires confirmation before a broad rebuild or fresh-construction handoff.
- Uses an explicit Addition Pool and protected-card context.
- Pairs additions with cuts and reanalyses the aggregate resulting deck.
- Keeps proposal acceptance separate from confirmation of the exact persisted change set.

## Temporary Architecture Seam

`docs/architecture.md` correctly places stable Collection analysis and Deck Opportunity discovery in the portable core.
This slice deliberately keeps nondeterministic methodology and ranking in OpenCode skills while core Card Query,
legality, persistence, and Collection facts remain authoritative. Promote only repeated, stable calculations after the
manual scenario corpus demonstrates that their Interfaces are understood.

Durable Deck Opportunity persistence remains an unimplemented product requirement. The transient shortlist must not be
described as a saved Deck Opportunity.

## Verification

- Deterministic tests verify intent routing, required methodology invariants, and Card Query allow-list scoping.
- Manual invariant scenarios live in `docs/testing/deck-building-workflow-scenarios.md` and never compare exact
  decklists.
- The reference qualitative run uses Sol at a recorded fixed reasoning effort. Terra may be compared only at the same
  effort after Sol passes; the comparison is diagnostic and not a default-suite gate.
