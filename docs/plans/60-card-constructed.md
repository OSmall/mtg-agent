# 60-card Constructed Support

## Goal

Extend Tomekin's collection-first deck building from Commander/EDH to paper-first 60-card Constructed Formats while
preserving the existing Commander behavior. Tomekin should build cohesive Mainboards, validate the relevant Format, and
build a Sideboard only when the user asks for one.

## Canonical Language

- Use **60-card Constructed** for the family rather than `Constructed`, `normal Magic`, or `non-Commander`. Commander is
  also a Constructed Format.
- Use **Casual 60** as Tomekin's canonical unsanctioned Format name and `casual_60` as the expected machine-facing
  value.
- Do not give Casual 60 alternate Format aliases.
- Use **Mainboard** for the primary deck section, **Commander** for the command-zone section, and **Sideboard** for the
  optional between-games section.
- Rename the current Deck Candidate `deck` section to `mainboard` as part of implementation. ManaBox already uses the
  Commander and Mainboard terms.

## Initial Format Family

The initial paper-first family is:

- Standard
- Pioneer
- Modern
- Legacy
- Vintage
- Pauper
- Casual 60

Arena-first, digital-only, historical, and other unusual formats are not part of the initial slice. The data model may
retain source-provided legality records for them without exposing them as supported Deck Candidate Formats.

## Deck Shape

For the sanctioned 60-card Formats, deterministic rules must come from the applicable current rules and local legality
data rather than being inferred from the agent's prose.

The intended common behavior is:

- A legal Mainboard has at least 60 cards. Tomekin should normally build exactly 60 because additional cards reduce
  consistency, but the validator should not reject an otherwise legal Mainboard merely for containing more than 60.
- The ordinary copy limit is four across the Mainboard and Sideboard together, counted by Card Identity ID.
- Basic lands and cards with Copy Limit Overrides follow their applicable deck-construction rules.
- A Sideboard is optional and contains no more than 15 cards.
- Tomekin should build no Sideboard by default. When the user asks for one, the agent should build a coherent Sideboard
  that addresses likely matchups and can be used without undermining the Mainboard's plan.

Commander Deck Candidates continue to use a Commander section and Mainboard. Commander does not gain a Sideboard from
this work.

## Casual 60

Casual 60 exists for collection-first deck building without pretending an eclectic physical collection is a competitive
Vintage, Legacy, or Modern card pool.

Its intended rules are:

- Mainboard minimum 60; Tomekin normally builds exactly 60.
- Four-copy default across Mainboard and Sideboard together.
- Basic-land and Copy Limit Overrides still apply.
- Optional Sideboard with a maximum of 15.
- No set/card-pool legality, banned-list, or restricted-list validation.

Casual 60 does not imply maximum power, low power, competitiveness, or a particular social contract. Power Level and
play experience remain Deck Building Preferences. Ignoring sanctioned legality simplifies the Legality Assessment but
widens the available card pool; the Collection and Deck Building Brief remain the principal bounds on agent choices.

## Deck-construction Legality Boundary

Tomekin should own a narrow deterministic deck-construction Legality Assessment. It is not intended to become a full
Magic rules engine.

The assessment should cover:

- supported Format and required local reference data;
- Mainboard and Sideboard size;
- format legality, banned status, and restricted status where the Format uses them;
- quantities aggregated by Card Identity ID across relevant sections;
- basic-land exceptions;
- Copy Limit Overrides derived from Oracle text; and
- existing Commander-specific rules only through the current Commander path.

Scryfall remains the source of per-card Format legality and current Oracle card data. It does not provide a complete
deck-validation result, so Tomekin must combine those source facts with its own deck-shape and copy-limit rules. A
remote third-party validator, including Scrollrack, should not become a production dependency.

## Copy Limit Overrides

Copy-limit behavior is shared by Commander and 60-card Constructed validation, but this work must not alter commander or
command-zone eligibility.

The importer should compile a card's Copy Limit Override from canonical Card Identity type and Oracle text during the
`oracle_cards` import. It should not persist a final absolute `maxCopies`, because the ordinary default is
Format-specific. The normalized result needs to distinguish at least:

- no card-specific override;
- unlimited copies;
- an explicit upper bound; and
- recognizable deck-construction text whose rule is not understood.

Examples include Rat Colony's unlimited quantity, Seven Dwarves' limit of seven, and Nazgûl's limit of nine. Basic-land
handling must follow card typing rather than a hard-coded list of English card names.

Compilation must remain a pure local operation in the existing streaming Oracle Cards pass. It must add no per-card
network requests or database reads. Import phase timing should remain observable, and implementation should verify that
the added parsing does not materially regress the already lengthy Scryfall sync.

Unrecognized deck-construction wording should not silently receive the Format default and should not make the entire
reference-data import unusable. The import should retain a warning and an unknown normalized result. A Legality
Assessment for a deck containing that Card Identity should report that specific unknown construction rule rather than
claiming the deck is legal or categorically unsupported.

## Format Legality Data

The current Scryfall Oracle Cards mapping imports every source-provided legality entry, which is suitable for expanding
the supported Format family. The import contract still needs to require legality keys for every supported sanctioned
Format rather than accepting an arbitrary non-empty legality object.

The intended handling is:

- Missing required legality keys in an `oracle_cards` source record are a blocking import error. The previous usable
  reference dataset must remain intact.
- A missing required legality record encountered defensively at analysis time is unsupported or incomplete local data,
  never silently legal.
- Casual 60 deliberately bypasses per-format legality, banned, and restricted checks.
- A Legality Assessment should expose the Scryfall source timestamp it is based on.
- Existing reference-readiness behavior warns when successful source data is more than 14 days old. Staleness is a
  warning rather than a casual-analysis blocker; missing data and stale data remain distinct states.

## Architecture Direction

Format-dependent behavior should be selected explicitly at runtime behind a focused Format-rules boundary. Pure rules do
not need dependency injection merely to vary by Format; repositories and other external data access should continue to
use the project's existing injected ports.

The implementation should prefer small, testable rule functions or strategies for:

- permitted Deck Candidate sections;
- deck and Sideboard size;
- ordinary copy limit and exception handling;
- source legality interpretation; and
- Format-specific evaluation and rendering conventions.

This feature may perform focused refactoring needed to create those seams. It should not become a broad codebase cleanup
or speculative abstraction exercise.

## Explicit Commander Boundary

Do not change commander or command-zone eligibility in this work.

In particular, do not expand or rewrite validation for Planeswalker commanders, Partner, Partner with, Friends forever,
Choose a Background, Doctor's companion, multiple commanders, or other command-zone exceptions. Those changes are
larger, independently risky, and outside the purpose of enabling 60-card Constructed deck building.

Existing Commander eligibility behavior should be preserved. Only the shared quantity calculation may change for
Commander so that basic lands and Copy Limit Overrides are validated correctly.

## Agent Methodology

Adding deterministic format support is not enough to make the agent a strong 60-card deck builder. A later
implementation slice must research authoritative and well-regarded articles, videos, and guides, then convert the stable
findings into a dedicated methodology skill.

The research should preserve broadly stable concepts such as consistency, mana curve, threat density, interaction,
redundancy, card advantage, mana-base construction, and coherent win conditions. Format metagame claims, archetype
positioning, and Sideboard plans are more time-sensitive and should be grounded in appropriately current sources rather
than treated as timeless skill instructions.

No final 60-card deck-building methodology or source set has yet been selected.

## Observed Code Gaps

The initial code review found these relevant gaps:

- Deck Building Briefs and Deck Candidates currently admit only Commander.
- Persisted Deck Candidates currently constrain Format to Commander.
- Deck Candidate sections currently use `commander` and `deck`, not `commander`, `mainboard`, and `sideboard`.
- Card Query legality properties and includes are Commander-specific even though the imported legality table is generic.
- The current Commander quantity validator aggregates by card name, recognizes basic lands through a hard-coded name
  list, and does not honor Oracle-text Copy Limit Overrides.
- Missing Commander legality rows are currently ignored during validation.
- The Oracle Cards schema accepts any non-empty legality record instead of requiring the supported sanctioned keys.
- Candidate rendering assumes only Commander and Deck sections.

These are implementation inputs, not authorization to edit the code while the feature remains in scoping.

## Testing Direction

Implementation should begin with behavior-focused tests and include a format matrix covering each supported Format.
Fixtures should cover:

- exactly 60 and more than 60 Mainboard cards;
- zero, partial, and 15-card Sideboards, plus rejection above 15;
- a fifth ordinary copy split across Mainboard and Sideboard;
- basic and snow basic lands;
- unlimited and numeric Copy Limit Overrides;
- restricted Vintage cards;
- legal, banned, not-legal, missing, and stale legality data;
- Casual 60 bypassing sanctioned legality while preserving construction rules; and
- regression coverage proving Commander eligibility behavior did not change.

## Remaining Decisions

Before implementation, the plan still needs a focused design/grilling pass for:

- the exact public and persisted Format identifiers besides `casual_60`;
- the normalized Copy Limit Override representation and how its derivation is rebuilt when parser behavior changes;
- the exact Legality Assessment result and error taxonomy, including unknown card construction rules;
- migration and compatibility behavior for renaming `deck` to `mainboard`;
- portable decklist section syntax for Mainboard and optional Sideboard;
- how Format legality filters become generic in Card Query without destabilizing existing queries;
- whether supported-format legality completeness is checked per source record or through an equivalent dataset-level
  invariant; and
- the authoritative research corpus and evaluation approach for the 60-card deck-building skill.

Commander eligibility is not one of these decisions; it is explicitly deferred.
