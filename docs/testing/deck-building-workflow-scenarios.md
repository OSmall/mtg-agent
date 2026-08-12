# Deck-Building Workflow Manual Scenarios

## Purpose

Use these frozen scenarios to evaluate Deck Opportunity discovery, fresh 60-card construction, and 60-card tuning
without requiring one exact decklist. They are manual or opt-in live-model checks and do not run under `bun test`.

For every run record date, Tomekin revision, Collection import timestamp, model, reasoning effort, and material Brief
assumptions. Run the initial reference pass with Sol at one fixed reasoning effort. Compare Terra only at that same
effort after Sol passes.

## Critical Invariants

Every applicable scenario must satisfy all of these:

- Use only the confirmed Collection Location allow-list for Collection evidence.
- Stop on deterministic illegality rather than overriding it.
- Never claim playtesting, simulation, goldfishing, current prices, or current metagame knowledge.
- Never pad a Deck Opportunity shortlist or force a Deck Candidate through a stated viability blocker.
- Distinguish Power Level from pilot complexity.
- Distinguish selection or looting from net card advantage.
- Support curve and mana conclusions with explicit evidence.
- Challenge weak cards instead of retaining them merely because they match the theme.
- Recheck scoped final Availability before rendering a Deck Candidate.
- Do not persist a shortlist, proposal, or newly revealed final tuning change set.

Any critical-invariant failure fails the scenario regardless of the subjective deck quality.

## Scenario 1: Open Collection Opportunity Comparison

Ask what can be built from an allowed starter deck plus binders while other Existing Deck locations are excluded. Seed
the allowed Collection with at least two plausible plans and one recognizable but structurally weak theme.

Accept when the agent compares viable functional plans before construction, returns no more than three opportunities,
downgrades or rejects the weak theme with specific blockers, and waits for a choice.

## Scenario 2: Strong But Approachable

Request a strong-casual 60-card deck that demonstrates the strategy's potential for an intermediate player without
excessive bookkeeping or obscure sequencing.

Accept when the agent preserves requested strength, expresses complexity separately in `playExperience`, and chooses
approachable lines or cards without substituting generally weak cards.

## Scenario 3: Suspicious Mana Curve

Provide a candidate pool whose theme has many attractive expensive spells and too few functional early actions.

Accept when the agent describes the intended turn sequence, examines the actual distribution and early actions, then
revises the curve or explicitly justifies a nonstandard curve through reliable ramp or survival. A raw histogram alone
is insufficient.

## Scenario 4: Selection Is Not Card Advantage

Provide strong looting/filtering support but little net card advantage.

Accept when the agent records selection separately, identifies whether discard or graveyard setup converts its cost into
material value, and does not declare card-advantage coverage healthy solely from looting tags or text.

## Scenario 5: Weak Theme Cards

Provide enough on-theme cards to fill a deck, including several low-impact cards with weak timing, dependencies, or
payoffs.

Accept when fresh construction identifies its three weakest nonlands and replaces or specifically justifies them. “On
theme” alone is not a justification.

## Scenario 6: No Viable Opportunity

Restrict the Collection and Missing Card tolerance so no direction has enough enablers, payoffs, mana support,
interaction, or credible win conditions.

Accept when the agent returns blockers and constrained next moves rather than a weak shortlist or full decklist.

## Scenario 7: Existing Deck Rebuild Gate

Present a 60-card Existing Deck whose recognizable identity is undermined by an incoherent plan, poor curve, inadequate
mana, and many weak cards.

Accept when tuning diagnoses the foundation, recommends rebuild around identity or fresh construction, explains what is
and is not preserved, and waits for confirmation before entering architecture.

## Scenario 8: Focused Tuning

Present a structurally healthy 60-card deck plus a small Addition Pool containing clear improvements and tempting
off-plan cards.

Accept when tuning recommends the smallest coherent set, pairs every addition with a cut, rejects off-plan candidates,
and reanalyses the aggregate deck.

## Scenario 9: Collection Scope Consistency

Use a binder and Existing Deck with the same name, allow only the binder plus a differently named deck, and place
stronger tempting cards in the excluded same-name deck.

Accept when every Collection query preserves exact `(locationType, locationName)` pairs, projected evidence excludes the
same-name deck, and the final Availability recheck uses the same scope.

## Recording Results

Record pass/fail per invariant and concise human notes. Do not use an LLM judge, aggregate quality score, exact-card
golden list, or CI threshold. Keep raw traces outside the repository unless they are deliberately sanitized into stable
fixtures.

## Real-session Test Prompts

Run these in fresh OpenCode sessions so prior card choices and large tool results do not anchor the model. Replace the
bracketed values with exact Collection Location names returned by Tomekin.

### Discovery through construction

```text
Using only these Collection Locations: [type/name pairs], show me the best deck opportunities for a [Format] deck.
I want [Power Level or Commander Bracket], while keeping the play experience [complexity and feel].
Do not build a full decklist until I choose a direction. Compare genuine functional plans, reject directions that lack
the required support, and tell me the most important caveat for each viable opportunity.
```

After choosing:

```text
Build the [chosen opportunity] direction under the confirmed Brief. Before presenting the final candidate, explicitly
review the curve, distinguish net card advantage from selection or looting, challenge the three weakest included
nonlands, and recheck final Availability against the unchanged Collection Location allow-list.
```

### Existing Deck tuning

```text
Review the Existing Deck at [type/name]. My goal is [goal], my intended Power Level is [strength], and my desired play
experience is [complexity and feel]. The Addition Pool is [allowed Collection Locations and/or Missing Card policy].
Diagnose whether this should be a focused repair, a rebuild around its identity, or fresh construction before proposing
changes. Do not persist anything.
```

### Results review in a new development session

```text
Review the attached OpenCode deck-building session and relevant Tomekin logs against
docs/testing/deck-building-workflow-scenarios.md. Identify which failures come from skill instructions, Card Query or
tool Interfaces, context truncation, missing Collection evidence, or model behaviour. Report evidence and recommend the
smallest next improvement before editing.
```
