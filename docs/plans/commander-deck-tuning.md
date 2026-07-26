# Commander Deck Tuning Skill

## Status

Planned. The product behaviour and initial implementation boundary have been confirmed.

## Goal

Add a Commander-specific methodology skill that helps the agent evaluate additions, identify cuts, and propose coherent
changes to an Existing Deck or Deck Candidate. The skill should support both user-nominated card reviews and open-ended
deck tuning without claiming mathematical optimality.

The initial implementation should use the existing Tomekin tools, local Scryfall reference data, Card Identity Tags,
agent reasoning, and deterministic validation. It should not add a structured Deck Role model or new analysis service.

## Research Basis

The methodology is informed by:

- [EDHREC Guide to Upgrading Your Commander Deck](https://edhrec.com/guides/edhrec-guide-to-upgrading-your-commander-deck):
  repair structural deficits, adapt generic counts to the commander, cut redundant or inefficient effects, consider the
  mana curve, and prefer synergistic or flexible additions.
- [Commander Power Levels Deckbuilding Template](https://www.commanderpowerlevels.com/deckbuilding/template): role
  targets are starting points, and individual cards may contribute to several structural needs.
- [EDHREC commander mana-curve analysis](https://edhrec.com/articles/paradigm-shift-how-your-commanders-mana-value-alters-your-curve):
  the commander and strategy materially change appropriate curve expectations.
- [Commander Brackets Beta Update, October 21 2025](https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025):
  power and play experience depend on intent and expected gameplay, not only individual card inclusion.

These sources support a cohesive tuning heuristic, not a universal formula or guaranteed optimum.

## Supported Requests

### Candidate Review

Evaluate user-nominated cards against an Existing Deck or Deck Candidate.

- Recommend none, some, or all of the nominated cards.
- Pair every recommended addition with a cut.
- Answer the nominated-card question before suggesting a materially better alternative.
- Do not require confirmation of a full Deck Building Brief when the deck and conversation already establish enough
  context.
- Ask only for missing information that could materially change the answer.

Example:

> I have these four new cards. Which should I include, and what should I cut for them?

### Open Deck Review

Diagnose the deck and propose the highest-value changes under a concise confirmed tuning brief.

- Require an explicit Addition Pool: Available Cards, permitted Committed Cards, all legal cards including Missing
  Cards, or another user-defined scope.
- Use the smallest coherent set of high-confidence changes by default.
- Separate marginal or lower-confidence opportunities.
- Ask whether the user wants a larger rebuild when broad structural problems require extensive changes.

Example:

> What are the best changes I can make to this deck right now?

### Future Price-Constrained Purchase Tuning

When reliable current prices exist, support requests such as:

> What are the best five singles I can buy for this deck with a budget of $20?

Purchase count and budget are ceilings unless the user explicitly requires exact values. Do not pad the recommendation
or exhaust the budget with weak purchases. Evaluate the combined set of purchases and cuts, and leave an appropriate
margin for volatile prices.

Price support is not part of the initial implementation.

## Skill Composition And Activation

Create `.opencode/skills/commander-deck-tuning/SKILL.md`.

The skill should:

- Be loaded automatically for confirmed Commander requests concerning an Existing Deck, additions, cuts, swaps,
  upgrades, or deck improvement.
- Remain explicitly invokable by the user.
- Compose `commander-deck-architecture` for Commander structural guidance.
- Load `query-cards` before non-trivial tag or card queries.
- Use `tomekin-deck-building` for the overall tool lifecycle, deterministic validation, rendering, and persistence.
- Keep generic `Deck Tuning` product language format-extensible.

## Methodology

### 1. Establish Tuning Context

Determine from conversation context or concise clarification:

- Existing Deck or Deck Candidate being tuned.
- Tuning goal and direction: stronger, weaker, lateral, thematic, more resilient, less commander-dependent, or another
  stated objective.
- Intended Commander Bracket and play experience when relevant.
- Addition Pool.
- Protected or identity-defining cards already established by the user.
- Requested change count or budget when present.
- Relevant gameplay observations when available.

Do not infer an Addition Pool from phrases such as `right now`. Do not ask an exhaustive questionnaire when existing
context is sufficient.

### 2. Diagnose The Current Deck

Identify:

- Commander and game plan.
- Important Deck Packages and dependencies.
- Agent-defined, task-specific Deck Roles.
- Useful role counts and likely underrepresentation or overrepresentation.
- Mana curve and mana-base concerns.
- Credible win paths, resilience, interaction, card advantage, and commander dependence.
- Redundant, inefficient, overly conditional, or off-plan cards.

Use Commander architecture targets as adjustable starting-point ranges, not pass-or-fail thresholds.

User-reported gameplay patterns are stronger evidence than generic targets when relevant. If no gameplay observations
exist, perform static analysis and do not claim playtesting, simulation, or goldfishing.

### 3. Infer Deck Roles Without A Project Taxonomy

Use deterministic evidence retrieval and flexible agent judgment:

- Direct and Inherited Card Identity Tags.
- Tagging weights and annotations.
- Oracle text and Card Parts.
- Card types, mana cost, Mana Value, keywords, restrictions, and repeatability.
- Required board state and dependence on the commander or another Deck Package.
- Modal competition and other opportunity costs.

The agent may group cards into transient roles and count those groups. Cards may appear in several roles when that
reflects their actual function in the deck. Counts are diagnostic evidence rather than persisted card facts. Do not add
database fields, a canonical role taxonomy, aliases, numeric role scores, or fixed contribution enums in the initial
implementation.

### 4. Discover Candidate Additions

Search the confirmed Addition Pool using:

- Underrepresented Deck Roles and Deck Packages.
- Tag snowballing from the commander and high-signal cards.
- Direct and Inherited Card Identity Tags.
- Multi-signal overlap across tags, Oracle text, card properties, and package needs.
- Efficiency, reliability, flexibility, mana curve, and internal affinity.

Use EDHREC rank for discovery or as a weak tie-breaker only. Generic popularity is not proof of card quality or
deck-specific fit.

### 5. Pair Additions And Cuts

Apply this hierarchy:

1. When the deck's aggregate structure is healthy, prefer a like-for-like cut in the same Deck Role or Deck Package
   slot.
2. When an addition repairs a meaningful deficit, cut the lowest-value card from a genuine surplus elsewhere.
3. Never infer a surplus from raw counts alone. Account for overlapping roles, package dependencies, curve, commander
   contributions, and conditional functions.

Evaluate the proposed changes as a complete set. A series of individually reasonable swaps may collectively create a new
deficit.

### 6. Handle Special Cases

- Lands may be added, cut, or replaced, but analyse the mana base as a system. Do not use a land as a convenient generic
  cut. Justify reductions using land count, colored sources, tapped lands, utility lands, curve, ramp, and commander
  cost.
- Explicitly protected theme or pet cards are not cuts unless the user permits it. When intent is ambiguous, distinguish
  performance weakness from a possibly intentional play-experience choice.
- A commander swap may be valid Deck Tuning when it preserves a substantially similar game plan. Present it explicitly
  with advantages, disadvantages, and command-zone implications.
- A commander change that preserves Color Identity may remain in the current proposal.
- A commander change that alters Color Identity becomes a separate Deck Candidate variant and requires confirmation
  before construction.
- Deck Tuning may increase, reduce, or preserve power according to the tuning brief.

## Deck Change Proposal

A tuning analysis should produce a non-persisted Deck Change Proposal. Use these sections when relevant and omit empty
sections:

1. **Tuning Context**
   - Goal.
   - Addition Pool.
   - Power and play-experience direction.
   - Material assumptions.
2. **Deck Diagnosis**
   - Game plan.
   - Relevant role groupings and counts.
   - Deficits, surpluses, package, curve, or mana concerns.
3. **Recommended Changes**
   - Exact paired additions and cuts.
   - Concise rationale.
   - Collection status where relevant.
4. **Rejected Candidates**
   - Only user-nominated cards that should not be included.
5. **Aggregate Effect**
   - Resulting role representation.
   - Curve and mana effects.
   - Strategic trade-offs.
   - Commander Bracket implications when relevant.
6. **Further Opportunities**
   - Optional lower-confidence or larger changes.
7. **Persistence Status**
   - State explicitly that nothing was saved.

Quick candidate reviews should remain concise.

## Acceptance, Application, And Persistence

- The user may accept, reject, or modify individual swaps.
- Reanalyse the aggregate deck after partial acceptance and explain broken dependencies.
- Build a complete revised Deck Candidate only when the user explicitly asks to apply or accept a proposal.
- Do not persist merely because the user accepted the strategic recommendation.
- Before persistence, present an explicit final Change Summary with exact additions, cuts, quantities, and commander
  changes.
- Never persist in the same message that first reveals the exact final change set.
- Wait for confirmation of that exact change set.
- After confirmation, resolve the resulting list and rerun deterministic legality and Deck Candidate evaluation before
  saving.

## Initial Implementation Files

Expected changes:

- Add `.opencode/skills/commander-deck-tuning/SKILL.md`.
- Update `.opencode/skills/tomekin-deck-building/SKILL.md` with tuning-skill routing and persistence boundaries.
- Update `.opencode/agents/tomekin-deck-builder.md` so tuning intent loads the skill automatically while preserving
  explicit invocation.
- Update `README.md` if the new user-facing tuning capability needs to be listed.
- Keep `CONTEXT.md`, `docs/mvp.md`, `docs/design-branches.md`, and `docs/testing.md` synchronized with implementation.

## Initial Definition Of Done

- The `commander-deck-tuning` skill exists with valid frontmatter and the confirmed methodology.
- Candidate review and open deck review are clearly supported.
- The agent automatically loads the skill for relevant Commander requests, and explicit invocation remains possible.
- The skill uses existing Tomekin tools, Card Identity Tags, and agent reasoning.
- The Deck Change Proposal format and two-stage persistence boundary are explicit.
- Relevant documentation is updated.
- A lightweight manual smoke test checks that the skill can be discovered and that its instructions compose correctly
  with the existing skills and agent.

## Initial Non-Goals

- Database changes or SQLite migrations.
- Persisted Deck Roles or Role Coverage.
- A project-owned role taxonomy, alias database, or numeric scoring system.
- A new deterministic role-analysis or tuning tool.
- Price support.
- Gameplay simulation, opening-hand analysis, or goldfishing.
- A comprehensive LLM scenario suite.

Future scenario-evaluation cases are recorded in [`../testing.md`](../testing.md).

