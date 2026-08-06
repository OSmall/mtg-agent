# 60-card Constructed Slice 2 Research and Implementation Strategy

## Status

Approved on 6 August 2026. This document records the research and design gate used before Slice 2 tests and production
changes began.

Slice 1 already provides the internal Format model, reference imports, deterministic Legality Assessment, persistence,
Card Query support, and rendering. Slice 2 should expose those capabilities through the local Tomekin agent and give the
agent a source-backed method for constructing cohesive 60-card Constructed Deck Candidates.

No live-model evaluation runner, judging agent, metagame feed, or new deterministic deck-quality engine belongs in this
slice.

## Approval Decisions

Approval of this strategy confirms these public-interface and behavior choices:

1. Add one `sixty-card-constructed-deck-architecture` skill for Standard, Pioneer, Modern, Legacy, Vintage, Pauper, and
   Casual 60. Keep Commander construction and tuning in their existing Commander-specific skills.
2. Require a strict, Format-discriminated Deck Building Brief when validating or evaluating a Deck Candidate. The agent
   tool derives Format from `brief.format`; callers do not supply a second Format that can disagree.
3. Add an explicit required `format` only to rendering, where no Deck Candidate or save input exists from which to
   derive it. Saving continues to derive persisted Format from the authoritative Brief.
4. Expose the supported sanctioned legality properties through Card Query while continuing to reject
   `legality.casual_60` and unsupported Scryfall Format properties.
5. Build no Sideboard by default. A Sideboard request without matchup or local-play context triggers one focused
   question. A user may instead request a general-purpose Sideboard, in which case the agent records broad-coverage
   assumptions and does not claim knowledge of the current metagame.
6. Treat the land-count formula below as an explainable starting heuristic, never as a legality rule, quality score, or
   universal prescription.
7. Keep automated coverage deterministic and manually exercise the existing Tomekin agent before release.

## Research Method

The corpus is intentionally small and attributable. Reid Duke's Wizards of the Coast `Level One` course supplies the
stable conceptual backbone. Frank Karsten's updated quantitative analysis supplies a land-count starting point. No
current tournament decklists are adopted as permanent instructions.

Each adopted claim was screened using these questions:

- Is it about durable deck-construction reasoning rather than a dated card or metagame?
- Can the agent apply it using the user's Brief, local Scryfall data, and imported Collection?
- Does it remain advisory where matchup data, testing, or probabilities are incomplete?
- Does it preserve the product boundary that deterministic legality outranks agent judgment?

The source review deliberately distinguishes stable methodology from volatile examples. Named decks, individual card
choices, 2014-2015 Format conditions, and claims about popular strategies are examples only and will not appear as
timeless instructions.

## Research Manifest

All sources were accessed on 6 August 2026.

### Course index

- Author/publisher: Wizards of the Coast, collecting Reid Duke's course.
- Title: [Level One: The Full Course](https://magic.wizards.com/en/news/feature/level-one-full-course-2015-10-05)
- Published: 5 October 2015.
- Classification: stable index; individual historical examples are volatile.
- Adopted claims: deck construction should relate archetype, tempo, card advantage, threats and answers, mana, and
  Sideboard planning as one system rather than isolated card choices.

### Strategy coherence and redundancy

- Author: Reid Duke.
- Title: [Linear Strategies](https://magic.wizards.com/en/news/feature/linear-strategies-2014-12-29)
- Published: 30 December 2014.
- Classification: stable principle; example lists and cards are volatile.
- Adopted claims: a focused strategy asks each card to contribute to the plan; synergy and sufficient density can make a
  cohesive package stronger than individually superior but unrelated cards. Tomekin should identify enablers, payoffs,
  engines, and redundant functional pieces rather than assemble a pile of staples.

### Archetype and game-plan shape

- Author: Reid Duke.
- Titles:
    - [Aggro Decks](https://magic.wizards.com/en/news/feature/aggro-decks-2014-09-29)
    - [Control Decks](https://magic.wizards.com/en/news/feature/control-decks-2014-10-06)
    - [Midrange Decks](https://magic.wizards.com/en/news/feature/midrange-decks-2014-10-27)
- Published: 29 September, 6 October, and 27 October 2014.
- Classification: stable archetype concepts; Format examples and lists are volatile.
- Adopted claims: aggro prioritizes early tempo and pressure; control prioritizes survival, answers, card advantage, and
  a credible late-game win; midrange balances offense and defense and changes roles as the matchup demands. These are
  lenses rather than a closed taxonomy: combo, tempo, ramp, tribal, and other plans may be described by their own win
  condition and resource pattern.

### Card advantage, tempo, threats, and answers

- Author: Reid Duke.
- Titles:
    - [The Basics of Card Advantage](https://magic.wizards.com/en/news/feature/basics-card-advantage-2015-07-13)
    - [Tempo & Card Advantage: A Delicate Balance](https://magic.wizards.com/en/news/feature/tempo-card-advantage-delicate-balance-2014-11-17)
    - [Threats and Answers](https://magic.wizards.com/en/news/feature/threats-and-answers-2014-09-08)
- Published: 13 July 2015, 18 November 2014, and 8 September 2014.
- Classification: stable principles; example cards are volatile.
- Adopted claims: cards and mana are both resources; card selection is not automatically card advantage; early turns
  often put a premium on mana efficiency and board development while longer games put more pressure on card advantage;
  proactive decks still need enough answers to remove blockers or disruptive permanents, while reactive decks need
  actual win conditions and answers broad enough for the expected opposition.

### Mana-base construction

- Author: Reid Duke.
- Title: [Building a Mana Base](https://magic.wizards.com/en/news/feature/building-mana-base-2014-11-24)
- Published: 24 November 2014.
- Classification: stable process; the article's exact source-count ranges and historical lands are advisory and may not
  fit every contemporary Format.
- Adopted claims: build the spells and mana base together; count colored sources rather than merely total lands; give
  early and intensive color requirements more support; and evaluate the tempo, life, and consistency costs of tapped,
  painful, utility, and multicolor lands in the context of the deck's plan.

- Author: Frank Karsten.
-
Title: [How Many Lands Do You Need in Your Deck? An Updated Analysis](https://www.tcgplayer.com/content/article/How-Many-Lands-Do-You-Need-in-Your-Deck-An-Updated-Analysis/cd1c1a24-d439-4a8e-b369-b936edb0b38a/)
- Updated: 13 February 2025; underlying 60-card event data covers 1 July 2020 through 1 July 2022.
- Classification: stable quantitative starting model with explicit limitations; card classifications, companion rules,
  and the source population are revision-sensitive.
- Adopted claims: for a 60-card Mainboard, an explainable initial estimate is
  `19.59 + 1.90 × average nonland mana value - 0.28 × cheap card-draw/ramp count + 0.27 × companion count`, counting
  non-mythic land/spell modal double-faced cards as 0.38 land and mythic ones as 0.74 land. The model was fitted to
  95,143 successful tournament decks, has substantial unexplained variation, omits important deck-specific features, and
  should be adjusted for the reliability of draw/ramp, utility lands, colors, curve shape, and the actual game plan.
  Therefore the skill will present it as a starting estimate and explain deviations, not mechanically enforce it.

### Sideboard construction and plans

- Author: Reid Duke.
- Titles:
    - [The Sideboard](https://magic.wizards.com/en/news/feature/sideboard-2015-08-10)
    - [Sideboard Plans](https://magic.wizards.com/en/news/feature/sideboard-plans-2015-03-09)
- Published: 10 August and 9 March 2015.
- Classification: stable method; named matchups, cards, and tournament conditions are volatile.
- Adopted claims: choose Sideboard cards for matchups and deck vulnerabilities rather than isolated opposing cards;
  identify realistic cards to bring in and take out; maintain the Mainboard's curve, role density, mana, and win
  condition after boarding; avoid over-sideboarding; begin with a plan but allow adaptation when observed information
  warrants it.

### Metagame boundary

- Author: Reid Duke.
- Title: [The Metagame](https://magic.wizards.com/en/news/feature/metagame-2015-06-01)
- Published: 1 June 2015.
- Classification: the concept is stable; all claims about popular decks, expected shares, and best positioning are
  volatile.
- Adopted claim: matchup preparation depends on information outside the game rules. Because normal Tomekin deck building
  is offline, the skill must not infer a current metagame from model memory. It may use user-supplied local context or
  explicitly dated sources in a future, separately authorized workflow.

## Source-backed Deck-building Method

The skill should direct the agent through the following reasoning process after a 60-card Constructed Brief is
confirmed.

### 1. Establish the game plan

State the Format, Format Anchor, expected play pattern, primary win condition, desired Power Level, play experience,
Collection Access Policy, budget and missing-card tolerance, and combo constraints. Describe the deck's strategic lens
without forcing every build into aggro, control, or midrange.

The game plan must answer:

- How does this deck get ahead or survive?
- What resource or board state does it develop?
- How does it convert that state into a win?
- Which opposing actions most directly interrupt it?

### 2. Build a coherent functional core

Use local Oracle text and direct and Inherited Card Identity Tags as evidence. Define task-specific roles such as early
pressure, engine enabler, payoff, selection, true card advantage, interaction, protection, sweeper, recursion, ramp, or
closer. Roles remain transient agent analysis; this slice adds no canonical role taxonomy or persistence fields.

Favor sufficient densities and functional redundancy. Use up to four copies of foundational cards when consistency and
the confirmed brief justify them. Use fewer copies when a card is expensive, narrow, legendary, redundant only in the
late game, searchable, or poor in multiples. Copy counts remain contextual and are always subject to deterministic
Format legality and Copy Limit Overrides.

### 3. Shape curve, tempo, and resource flow

Lay out what the deck needs to do on its early, middle, and closing turns. Check that it has enough early actions for
its plan, can spend mana efficiently, and has a credible use for cards and mana in longer games. Balance tempo and card
advantage according to the intended play pattern rather than maximizing either in isolation.

Proactive decks need sufficient threat density plus enough interaction to clear or prevent the problems that stop their
clock. Reactive decks need early survival, sufficiently broad answers, card advantage, and credible finishers. Linear
decks should avoid diluting their engine, but still account for the minimum interaction or resilience demanded by the
Brief and Format.

### 4. Build and audit the mana base

Construct spells and mana together, not sequentially. Use Karsten's formula only as an initial land-count estimate when
the relevant inputs can be calculated confidently. If modal double-faced cards, companions, cheap draw, or ramp cannot
be classified reliably from local evidence, do not pretend to calculate a precise result; use a reasoned range and label
the uncertainty.

Then audit:

- colored sources for early and intensive costs;
- reliability and timing of ramp and card selection;
- tapped-land tempo cost;
- life cost and other drawbacks;
- utility lands that do not cast important spells;
- the difference between total lands and usable sources on required turns; and
- whether the final curve or Sideboard plan changes those requirements.

The final explanation states the starting estimate, material adjustments, and remaining uncertainty. The deterministic
validator does not reject or warn merely because the Mainboard contains more than 60 cards or differs from the estimate.

### 5. Prefer 60 cards for consistency without making it a rule

Aim for exactly 60 Mainboard cards in ordinary circumstances because additional cards dilute access to the deck's best
and most important effects. More than 60 remains legal and may be correct for a card requirement, user constraint, or
explicit strategic reason. Explain the reason when choosing more than 60; do not present exact-60 as an invariant.

### 6. Handle the Sideboard only when requested

Do not create a Sideboard by default.

When requested:

1. Use matchup or local-play context already present in the conversation or Brief constraints.
2. If none exists, ask one focused question: which decks, strategies, or recurring problems should the Sideboard prepare
   for?
3. If the user explicitly wants general coverage, identify broad Mainboard vulnerabilities, record assumptions, and
   state that these are not current-metagame claims.
4. For every package, state the problem or matchup, exact cards in, likely cards out, and how the post-board deck
   retains its curve, mana, role density, and win condition.
5. Check the Mainboard and Sideboard together for copy limits and deterministic legality.

### 7. Validate, evaluate, revise, and render

Resolve every final card name locally. Run deterministic Format validation and stop on operational errors or illegal
results that the Brief does not explicitly resolve. Evaluate curve, land count, and Collection evidence without claiming
simulation or mathematical optimality. Revise for at most three full passes, then render canonical `Mainboard` and
optional `Sideboard` headings and save only after the final candidate and caveats are ready.

## Agent and Skill Architecture

### New skill

Create `.opencode/skills/sixty-card-constructed-deck-architecture/SKILL.md` as the canonical 60-card construction
method. It will contain the stable method above in compact operational form and reference this manifest for provenance.
It will not embed named historical decklists, current tier claims, or a dated Sideboard matrix.

### Existing skill updates

- `tomekin-deck-building` routes every confirmed 60-card Constructed Brief to the new skill and preserves Commander
  routing.
- `query-cards` documents all public sanctioned legality properties and legalities includes, while explaining that
  Casual 60 has no Scryfall legality property.
- Commander-specific architecture and tuning skills remain Commander-only and unchanged except for any canonical
  `Mainboard` terminology correction required by integration.

### Agent prompt updates

The primary agent will:

- advertise the full supported Format set;
- disambiguate an omitted Format before drafting a Brief instead of defaulting every request to Commander;
- preserve strict branch-specific Brief fields;
- automatically load the new skill for confirmed 60-card Constructed work;
- use local reference data for legality and card facts;
- follow the Sideboard question and assumption boundary;
- avoid live-metagame claims during normal offline work; and
- render `Commander`/`Mainboard` for Commander and `Mainboard`/optional `Sideboard` for 60-card Constructed.

## Public Tool Interface Plan

The portable core remains the source of product behavior; OpenCode schemas mirror it rather than reimplementing rules.

### Deck Building Brief

`draft_deck_building_brief` accepts the existing strict discriminated union:

- Commander requires `format: "commander"`, required-nullable `commanderBracket`, and `ruleZeroExceptions`.
- 60-card Constructed requires one of the seven 60-card Format values and required-nullable `powerLevel`.
- Cross-branch fields are rejected.

### Card Query and format constraints

Remove the public Commander-only filter in the agent handler. The public query schema admits
`commander`, `standard`, `pioneer`, `modern`, `legacy`, `vintage`, and `pauper` for legality properties/includes.
`casual_60` remains invalid because it intentionally bypasses Scryfall legality.

`get_format_constraints` admits all eight Deck Formats and returns the already-implemented Format-specific constraint
shape.

### Validation and evaluation

`validate_format_legality` and `evaluate_deck_candidate` accept:

```ts
{
  brief: DeckBuildingBrief;
  cards: Array<{
    cardIdentityId: string;
    quantity: number;
    section: "commander" | "mainboard" | "sideboard";
  }>;
}
```

They derive Format from `brief.format`, load local Card Identity details and the latest successful Oracle Cards source
timestamp, and call the Slice 1 `assessDeckLegality` boundary. Unknown section strings remain validation errors;
recognized sections disallowed by a Format return an illegal Legality Assessment.

Evaluation reports Format-neutral mana/curve data and the Brief's Power Level or Commander Bracket and play experience.
Commander Game Changer information remains available for Commander assessment but is not presented as a 60-card power
metric. Collection evidence remains separately sourced and is never invented.

### Rendering and persistence

`render_deck_candidate` adds required `format`, admits the shared section vocabulary, and delegates to the existing
Format-aware renderer.

`save_deck_candidate` removes the temporary Commander and no-Sideboard refinements. It keeps the strict Brief union and
shared card sections; repository writes continue to derive Format from the Brief.

## Vertical TDD Delivery Plan

Each numbered item is a separate red-green cycle. The next test is not written until the current one passes.

1. **Drafting tracer bullet:** a public handler drafts a Modern Brief and returns `format: modern` with `powerLevel`,
   proving the full path through the public core interface. Minimal implementation switches the handler to the existing
   union schema.
2. **Branch strictness:** a Modern Brief containing Commander fields returns `validation_error`; preserve the existing
   Commander behavior.
3. **Format constraints:** `get_format_constraints({format: "modern"})` returns the 60-card construction constraints.
4. **Card Query exposure:** a Modern legality query reaches the repository; `legality.casual_60` remains a validation
   error.
5. **Legality tracer bullet:** a resolved legal Modern Mainboard validated with a Modern Brief returns a legal
   assessment and the Oracle Cards source timestamp. Minimal implementation replaces the Commander-only wrapper with
   `assessDeckLegality`.
6. **Section behavior:** a recognized Commander section in Modern returns `illegal`; an unknown section is rejected at
   the tool-input boundary.
7. **Sideboard and copy behavior through the public interface:** a valid requested Sideboard is accepted, while Slice 1
   rules continue to reject size, copy, banned, restricted, and reference-invariant failures. Use focused wrapper tests
   rather than duplicating the existing Format matrix.
8. **Format-aware evaluation:** a 60-card evaluation reports curve/land data and Brief power/play-experience context
   without treating Game Changers as its power language. A Commander regression retains current Commander context.
9. **Rendering:** Modern renders `Mainboard` and optional `Sideboard`; Commander still renders `Commander` then
   `Mainboard`.
10. **Persistence exposure:** the public save handler accepts a Modern Brief and Sideboard rows, while the repository
    continues to derive the candidate Format from the Brief.
11. **OpenCode schemas:** the repo-local tools convert to JSON Schema with the strict Brief union, full supported Format
    set, and shared section vocabulary; execute one wrapper smoke test for a 60-card Brief.
12. **Skill routing and safety text:** deterministic config tests assert that the 60-card skill exists, the coordinator
    routes confirmed 60-card Briefs to it, the Sideboard gate is present, and outdated Commander-only public claims are
    absent. Assertions target required behavior statements rather than the full prose.
13. **Documentation cutover:** update README, product scope, future direction, testing status, and the parent plan to
    state that public 60-card Constructed support is delivered. Preserve the achieved Commander-first MVP document as a
    historical baseline.
14. **Refactor only while green:** remove obsolete Commander-only helpers and duplicated schemas, then run focused
    tests,
    `bun test`, and `bun run typecheck` after each meaningful cleanup.

External repositories are mocked only at their injected port in narrow core handler tests. SQLite integration tests use
real temporary databases where persistence or source timestamp behavior matters. Tests exercise exported public package
interfaces; they do not inspect private helpers or call a live model.

## Manual Release Exercise

After all automated checks pass, manually exercise the existing Tomekin agent with local ready reference data:

1. A no-Sideboard Modern request with a confirmed Brief.
2. A Pauper request that uses Collection evidence and deterministic legality.
3. A Casual 60 request containing cards that would be illegal in a sanctioned Format, proving that only construction
   rules apply.
4. A Sideboard request with supplied local matchups, checking explicit in/out plans.
5. A general-purpose Sideboard request, checking recorded assumptions and absence of current-metagame claims.
6. A Commander build regression, checking existing skill routing, Commander Bracket language, and canonical headings.

The review is qualitative and human. It records defects to fix but does not introduce a score, LLM judge, or CI gate.

## Done Bar

Slice 2 is complete when:

- the source manifest and the compact methodology skill agree;
- all eight supported Formats are reachable through the public agent workflow;
- strict Brief discrimination and authoritative Brief Format are preserved;
- 60-card validation uses the deterministic Slice 1 assessment including source timestamp;
- Card Query, rendering, Sideboard, persistence, and error boundaries are exposed correctly;
- the agent follows the Sideboard context boundary and makes no unstated current-metagame claims;
- Commander behavior remains covered and passing;
- `bun test` and `bun run typecheck` pass;
- the manual scenarios have been exercised; and
- user-facing documentation no longer describes the agent as Commander-only.

Implementation must not begin until this strategy is approved.
