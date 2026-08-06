---
name: sixty-card-constructed-deck-architecture
description: Use after a Standard, Pioneer, Modern, Legacy, Vintage, Pauper, or Casual 60 Deck Building Brief is confirmed to build a cohesive Mainboard and an optional requested Sideboard with Tomekin tools.
---

# 60-card Constructed Deck Architecture

Use this methodology after `tomekin-deck-building` confirms a Deck Building Brief whose Format is Standard, Pioneer,
Modern, Legacy, Vintage, Pauper, or Casual 60. This is the canonical 60-card Constructed construction method. It does
not replace `tomekin-deck-building` for tool orchestration, deterministic legality, rendering, or persistence.

The research provenance and stable-versus-volatile classification for this method are recorded in
`docs/plans/60-card-constructed-slice-2-strategy.md`.

## Core Principle

Build a deck that repeatedly executes one understandable game plan. Card quality matters, but cards must also have
enough enablers, payoffs, redundancy, mana, interaction, card advantage, resilience, and credible win conditions to
function together. Treat local Oracle text and direct and Inherited Card Identity Tags as evidence, not infallible role
assignments.

## 1. Confirm the Strategic Contract

Carry forward the confirmed Format, Format Anchor, Power Level, play experience, Collection Access Policy, budget,
missing-card tolerance, combo tolerance, constraints, exclusions, and assumptions.

State:

- how the deck gets ahead or survives;
- what resource or board state it develops;
- how it converts that state into a win; and
- which opposing actions most directly interrupt it.

Aggro, control, and midrange are useful lenses, not a closed taxonomy. Describe combo, tempo, ramp, typal, prison, and
other plans by their actual resource pattern and win condition. Do not force the deck into an archetype label that does
not clarify its construction.

## 2. Build a Cohesive Functional Core

Define task-specific Deck Roles and Deck Packages from the full card context. Examples include early pressure, engine
enabler, payoff, selection, true card advantage, interaction, protection, sweeper, recursion, ramp, and closer. These
roles are transient analysis; do not invent a canonical taxonomy, score, enum, or persistence field.

- Use `search_card_identity_tags` and `query_cards` to find packages with overlapping tag, Oracle-text, curve, and
  Collection evidence. Load `query-cards` before non-trivial filters.
- Prefer internal affinity: foundational cards should reinforce several other cards, not only one dream draw.
- Include enough enablers for the payoffs and enough redundant functional pieces to execute the plan consistently.
- Use up to four copies of foundational cards when consistency justifies them.
- Use fewer copies when a card is expensive, narrow, legendary, searchable, redundant only late, or poor in multiples.
- Let deterministic Format legality and Copy Limit Overrides decide what is permitted. Never infer legality from the
  methodology.

Aim for exactly 60 Mainboard cards in ordinary circumstances because extra cards dilute access to the most important
effects. More than 60 remains legal and may be correct for a card requirement, user constraint, or explicit strategic
reason. Explain that reason; exact-60 is a consistency preference, not a legality invariant.

## 3. Shape Curve, Tempo, and Resource Flow

Lay out the early, middle, and closing turns the deck is built to play. Check that it has enough early actions for its
plan, can spend mana efficiently, and has useful cards and mana sinks in longer games.

- Proactive decks need sufficient threat density and enough interaction to remove or prevent the problems that stop
  their clock.
- Reactive decks need early survival, broad enough answers, actual card advantage, and credible finishers.
- Linear decks should avoid diluting their engine while retaining the interaction or resilience demanded by the Brief
  and Format.
- Treat card selection and looting separately from net card advantage unless the deck converts the selection cost into
  real value.
- Balance tempo and card advantage according to the expected game stages rather than maximizing either in isolation.

Do not apply Commander role-density targets to a 60-card deck. Derive useful densities from the plan, curve, copy
counts, and available card pool, then explain material trade-offs.

## 4. Build Spells and Mana Together

Do not treat the mana base as leftover slots. Iterate spells, land count, and colored sources together.

When the necessary inputs are reliable, use Frank Karsten's 60-card formula only as an explainable starting estimate:

`19.59 + 1.90 × average nonland Mana Value - 0.28 × cheap draw/ramp count + 0.27 × companion count`

For that estimate, a non-mythic land/spell modal double-faced card counts as 0.38 land and a mythic one as 0.74 land.
The model has substantial unexplained variation and does not capture every deck feature. Do not report false precision.
If the relevant cards cannot be classified confidently from local evidence, use a reasoned range instead.

After the estimate, audit:

- colored sources for early and intensive mana costs;
- whether draw, selection, and ramp are early and reliable enough to affect land requirements;
- lands entering tapped and their cost to the intended curve;
- life payments and other land drawbacks;
- utility lands that do not cast important spells;
- usable sources on the required turn, not merely total land count; and
- Sideboard cards that create new colored or curve requirements.

State the starting estimate, material adjustments, and uncertainty. The deterministic validator must not reject or warn
merely because a legal Mainboard exceeds 60 cards or differs from this estimate.

## 5. Sideboard Gate and Construction

Do not create a Sideboard by default. Build one only when the user asks for one.

Use matchup or local-play context already present in the conversation or Brief constraints. If none exists, ask one
focused matchup question: which decks, strategies, or recurring problems should the Sideboard prepare for?

If the user explicitly requests general-purpose coverage:

- identify broad vulnerabilities in this Mainboard;
- record the broad-coverage assumptions in the Brief assumptions;
- do not present those assumptions as knowledge of the current metagame; and
- prefer flexible coverage over narrow hate without a stated target.

For every Sideboard package, state the problem or matchup, exact cards in, likely cards out, and how the post-board deck
retains its curve, mana, role density, and win condition. Avoid over-sideboarding. Think of Mainboard and Sideboard as a
coherent unit while respecting that the Mainboard must stand alone for Game 1.

## 6. Collection-first Selection

Follow the confirmed Collection Access Policy rather than maximizing owned-card use by default.

- Query Collection evidence before calling a card Available, Committed, or Missing.
- Prefer Available Cards when the Brief prioritizes Collection fit.
- Explain when a weaker Collection-supported choice conflicts with Power Level or play experience.
- Do not borrow Committed Cards, exceed budget, or widen the Missing Card pool without the Brief permitting it.
- Do not claim current prices or availability not returned by Tomekin tools.

## 7. Static Quality Review

True playtesting, opening-hand simulation, and goldfishing are not supported. Run a static review instead:

- coherent win condition and enough ways to reach it;
- enabler, payoff, and redundancy balance;
- threat and answer mix appropriate to the plan;
- curve and early-action density;
- card advantage and resilience;
- total lands, colored sources, and land drawbacks;
- cards that are narrow, stranded, contradictory, or weak in multiples; and
- Sideboard in/out plans when a Sideboard was requested.

Label uncertainty and user-context assumptions. Do not claim mathematical optimality or an unstated current metagame.

## 8. Validate and Hand Back

Return the candidate to `tomekin-deck-building` for the required lifecycle:

1. Resolve final names with `resolve_decklist_cards`.
2. Run `validate_format_legality` with the confirmed Brief.
3. Run `evaluate_deck_candidate` for aggregate legality, power/play-experience context, mana curve, land count, and
   Collection caveats.
4. Revise weak areas for at most three full passes.
5. Render canonical `Mainboard` and optional populated `Sideboard` sections.
6. Save only after the final list resolves, deterministic checks pass, and assumptions and caveats are represented.

## Final Explanation Requirements

State the game plan, Format and Power Level fit, important role and package densities, curve, land count and colored
source reasoning, key synergies, interaction, card advantage, Collection trade-offs, meaningful exclusions, legality and
source-data caveats, and the reason for any Mainboard above 60 cards.

When a Sideboard exists, also state matchup assumptions and concrete in/out plans. When none exists, do not add a
maybeboard or relabel Optional Upgrades as a Sideboard.
