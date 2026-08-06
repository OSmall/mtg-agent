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

## Deck Building Brief Format Shape

Model Deck Building Briefs as a strict discriminated union on their required `format`, because Format is part of the
confirmed instruction needed before a Deck Candidate exists. Their variants share goal, play experience, Format Anchor,
budget, Collection, combo, constraint, exclusion, and assumption fields. The Commander Brief alone contains
required-but-nullable `commanderBracket` and `ruleZeroExceptions`; it does not contain generic `powerLevel`, because
Commander Bracket is Commander's specialized expression of Power Level. A 60-card Constructed Brief alone contains a
required-but-nullable generic `powerLevel` relative to its Format and expected table; it does not contain
`commanderBracket` or `ruleZeroExceptions`. `playExperience` remains shared because desired game feel is distinct from
strength and optimization. Strict schemas must reject fields from the other Format branch rather than populating them
with null or empty values. The Brief-drafting tool must require and return `format` as structured data; it must never
depend on agent memory to carry Format between drafting and candidate persistence. Only Commander drafting should add
the existing missing-bracket confirmation assumption.

Do not expose a second independently writable top-level Format on the Deck Candidate domain model or save input. The
persisted `deck_candidate.format` column may remain as an internal query projection, but repository writes must derive
it from `brief.format`. The Brief is authoritative. This retains efficient candidate listing without making callers
supply two values that can disagree.

Retain both Format Anchor fields with distinct meanings rather than treating them as duplicated authority:
`brief.formatAnchor` is the user's requested or confirmed starting constraint, while `DeckCandidate.formatAnchor` is the
anchor actually selected for that candidate. They will commonly match, but a broad or null Brief anchor may produce a
more specific candidate anchor. This distinction requires no additional fields in this feature.

The persisted Brief JSON is the single source of truth for `commanderBracket`. Remove the duplicated top-level
`DeckCandidate.commanderBracket` field from public schemas, summaries, repository inputs, and the `deck_candidate`
table. The generated SQLite migration may drop `deck_candidate.commander_bracket` without copying it elsewhere because
existing Commander Brief JSON already contains the field; migration coverage must prove this value survives through the
Brief while the redundant column is removed. Candidate listings that need the value should derive it from the persisted
Brief rather than maintain a second independently writable copy.

Do not inspect, validate, or rewrite existing `brief_json` during the SQLite migration. Its existing `format` property
remains in place and becomes the authoritative domain value; the migration should preserve the JSON value unchanged.

## Initial Format Family

The initial paper-first family is:

- Standard
- Pioneer
- Modern
- Legacy
- Vintage
- Pauper
- Casual 60

The exact public and persisted Format identifiers are `commander`, `standard`, `pioneer`, `modern`, `legacy`,
`vintage`, `pauper`, and `casual_60`. Public schemas should validate this closed set strictly rather than normalizing
aliases, display names, or case variants. Human-facing output should render the corresponding Format names.

Arena-first, digital-only, historical, and other unusual formats are not part of the initial slice. The data model may
retain source-provided legality records for them without exposing them as supported Deck Candidate Formats.

## Deck Shape

Rename the persisted Deck Candidate card section `deck` to `mainboard` with a generated, data-preserving SQLite table
rebuild. The migration should transform every existing `deck_candidate_card.section = 'deck'` row to `mainboard` while
preserving Deck Candidate and card-row IDs, quantities, sort order, notes, and timestamps, and should expand the section
constraint to `commander`, `mainboard`, and `sideboard`. Public schemas should cut over strictly and must not retain
`deck` as an input alias. A populated-database migration test must prove existing Commander Deck Candidates survive the
transformation.

The migration should preserve existing Deck Candidate Markdown exactly rather than attempting unsafe SQL rewriting of
arbitrary agent-authored prose. Structured card rows and newly rendered Portable Decklists should use `mainboard` and
`Mainboard` immediately; legacy Markdown may retain its old `Deck` label until the user explicitly revises and saves the
candidate. Reducing or removing persisted derived Markdown is a separate future persistence redesign, not part of this
feature.

For the sanctioned 60-card Formats, deterministic rules must come from the applicable current rules and local legality
data rather than being inferred from the agent's prose.

The intended common behavior is:

- A legal Mainboard has at least 60 cards. The deterministic validator must neither reject nor warn merely because a
  Mainboard contains more than 60 cards.
- The ordinary copy limit is four across the Mainboard and Sideboard together, counted by Card Identity ID.
- Basic lands and cards with Copy Limit Overrides follow their applicable deck-construction rules.
- A Sideboard is optional and contains no more than 15 cards.
- Tomekin should build no Sideboard by default. When the user asks for one, the agent should build a coherent Sideboard
  that addresses likely matchups and can be used without undermining the Mainboard's plan.
- Normal deck building remains local and offline, so Tomekin must not claim unstated knowledge of the current metagame.
  If the user requests a Sideboard without giving expected matchups or local-play context, the agent should ask one
  focused matchup question. If the user explicitly wants a general-purpose Sideboard, it may cover broad Mainboard
  vulnerabilities but must label its assumptions rather than presenting them as current metagame facts. Record
  user-supplied matchup context in the existing Deck Building Brief `constraints` and broad-coverage assumptions in
  `assumptions`; do not add a dedicated expected-matchups field until a deterministic consumer needs one.

Commander Deck Candidates continue to use a Commander section and Mainboard. Commander does not gain a Sideboard from
this work.

Portable Decklists should use explicit canonical section headings and quantity-first card-name rows. A 60-card
Constructed list always starts with `Mainboard`; it includes `Sideboard` after one blank line only when Sideboard cards
exist. Commander continues to render `Commander` followed by `Mainboard`, separated by one blank line, and does not gain
a Sideboard. Card rows remain `quantity card name` with no set, collector number, categories, commentary, or printing
metadata. Do not retain the old `Deck` heading or adopt Arena-specific terminology.

## Casual 60

Casual 60 exists for collection-first deck building without pretending an eclectic physical collection is a competitive
Vintage, Legacy, or Modern card pool.

Its intended rules are:

- Mainboard minimum 60, with no deterministic maximum or above-minimum warning.
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

A successfully returned Legality Assessment has status `legal`, `illegal`, or `unsupported`. New 60-card Constructed
assessments should resolve to `legal` or `illegal`; `unsupported` remains only for existing Commander configurations
that the preserved Commander validator deliberately does not model. Missing or revision-incompatible reference data,
reference-data invariant violations, repository failures, unresolved Card Identities, and invalid tool input are
operational errors outside the Legality Assessment rather than Deck Candidate legality statuses.

Preserve the existing assessment result shape with free-text `reasons` and `warnings`; the agent can consume those
descriptions directly, and no current product consumer needs machine-readable finding codes. Add only the Scryfall
source timestamp required below. Structured Legality Assessment findings are deferred until a concrete UI, analytics,
localization, or automated-remediation consumer justifies the broader contract change.

Preserve the existing agent-tool error categories `validation_error` and `tool_error`, and add only a structured
`reference_data_unready` error carrying missing and reimport-required Scryfall datasets. This error gives the agent a
specific recovery action: stop reference-dependent deck building and tell the user what to import. Missing legality
rows, impossible persisted Copy Limit Override shapes, unresolved Card Identities, and repository failures remain
descriptive `tool_error` failures rather than Deck Candidate legality statuses or a larger new error taxonomy.

The assessment should cover:

- supported Format and required local reference data;
- Mainboard and Sideboard size;
- format legality, banned status, and restricted status where the Format uses them;
- quantities aggregated by Card Identity ID across relevant sections;
- basic-land exceptions;
- Copy Limit Overrides derived from Oracle text; and
- existing Commander-specific rules only through the current Commander path.

The shared section vocabulary is `commander`, `mainboard`, and `sideboard`, while each Format permits only its
applicable subset. A recognized section used with the wrong Format is a deck-construction failure and returns an
`illegal` assessment with a reason: for example, `commander` in Modern or `sideboard` in Commander. A section value
outside the shared vocabulary is malformed tool input and remains a `validation_error` rather than a legality result.

For Vintage, restricted status takes precedence over card-specific Copy Limit Overrides. A restricted Card Identity has
an effective maximum of one across Mainboard and Sideboard even when its Oracle text would otherwise permit additional
copies. Card text overrides the ordinary Format copy limit, not the Vintage restricted list.

Scryfall remains the source of per-card Format legality and current Oracle card data. It does not provide a complete
deck-validation result, so Tomekin must combine those source facts with its own deck-shape and copy-limit rules. A
remote third-party validator, including Scrollrack, should not become a production dependency.

## Copy Limit Overrides

Copy-limit behavior is shared by Commander and 60-card Constructed validation, but this work must not alter commander or
command-zone eligibility.

The importer should compile a card's Copy Limit Override from canonical Card Identity type and Oracle text during the
`oracle_cards` import. It should not persist a final absolute `maxCopies`, because the ordinary default is
Format-specific. The normalized result needs to distinguish:

- no card-specific override;
- unlimited copies;
- an explicit upper bound.

Represent the result as an explicit three-state union:

```ts
type CopyLimitOverride =
        | { kind: "none" }
        | { kind: "unlimited" }
        | { kind: "maximum"; maximum: number };
```

Persist it on Card Identity as a required `copy_limit_override_kind` plus a nullable numeric
`copy_limit_override_maximum`, which must be present only for `maximum`. The maximum must be a positive integer. Keep
canonical Oracle text as the source evidence rather than duplicating it inside the normalized override.

The schema migration must preserve existing Card Identity references while adding the required kind. It should populate
legacy rows with the structurally valid placeholder `none` and, in the same migration, assign existing `oracle_cards`
imports a legacy Import Contract Revision that cannot satisfy current reference readiness. The application must not
trust those placeholder values or permit reference-dependent agent operations until a successful full Oracle Cards
reimport explicitly recompiles every Card Identity and records the required revision. Do not give the kind column a
default for future writes; the importer must always supply it. Database checks should require a positive numeric maximum
only for `maximum` and require a null maximum for `none` and `unlimited`.

Examples include Rat Colony's unlimited quantity, Seven Dwarves' limit of seven, and Nazgûl's limit of nine. Treat a
Card Identity as a Basic Land only when the canonical type-line tokens before the em dash contain both the `Basic`
supertype and `Land` card type; when no dash exists, inspect the whole type line. Do not infer Basic Land status from
its name or from merely containing the `Land` type. This covers ordinary basics, Snow-Covered basics, and Wastes while
excluding nonbasic lands, and it avoids matching subtype text after the dash.

Compilation must remain a pure local operation in the existing streaming Oracle Cards pass. It must add no per-card
network requests or database reads. Import phase timing should remain observable, and implementation should verify that
the added parsing does not materially regress the already lengthy Scryfall sync.

Reference-data derivations should use a general per-dataset Import Contract Revision rather than a parser-specific
version or a global migration flag. Each successful Scryfall import record should persist the contract revision that
produced it, while core defines the revision currently required for each dataset. Reference readiness should compare the
latest successful import with the required revision and report a blocking, dataset-specific `reimport_required` result
when they differ. Existing unversioned import records should migrate to a legacy revision that cannot satisfy the new
contract accidentally. A changed parser, mapper, or imported representation should bump the affected dataset revision
whether or not the change also needs a schema migration; unrelated migrations should not force reimport. Migration and
import commands remain available while reference-dependent deck-building operations are blocked.

Detect potential copy-limit wording conservatively when canonical Oracle text contains both `deck` and `cards named`.
When neither appears together, compile `none`. When they do, require the complete relevant sentence to match a supported
canonical form: `A deck can have any number of cards named <this card>.` or `A deck can have up to <number> cards named
<this card>.` The first compiles `unlimited`; the second compiles a positive numeric `maximum`. The referenced name must
match the imported Card Identity, and the numeric parser must understand the complete number expression. Potential
copy-limit wording whose sentence, number, or referenced name cannot be understood must be a blocking `oracle_cards`
import error that identifies the affected Card Identity and wording. It must not silently receive the Format default or
persist an unknown normalized state. The existing staged import must preserve the previous usable reference dataset when
this occurs. The broad detection step is intentionally more permissive than the supported templates so future wording
changes fail visibly instead of silently compiling `none`.

## Format Legality Data

The current Scryfall Oracle Cards mapping imports every source-provided legality entry, which is suitable for expanding
the supported Format family. The import contract still needs to require legality keys for every supported sanctioned
Format rather than accepting an arbitrary non-empty legality object.

The intended handling is:

- Missing required legality keys in an `oracle_cards` source record are a blocking import error. The previous usable
  reference dataset must remain intact.
- Enforce that completeness invariant while validating each source record, not through a later dataset-level count or
  aggregate check. Every record must contain `commander`, `standard`, `pioneer`, `modern`, `legacy`, `vintage`, and
  `pauper`; other source-provided legality entries may still be retained.
- A missing required legality record encountered defensively at analysis time is a reference-data invariant violation,
  never a Deck Candidate legality status and never silently legal.
- Casual 60 deliberately bypasses per-format legality, banned, and restricted checks.
- A Legality Assessment should expose the Scryfall source timestamp it is based on.
- Existing reference-readiness behavior warns when successful source data is more than 14 days old. Staleness is a
  warning rather than a casual-analysis blocker; missing data and stale data remain distinct states.
- Preserve the existing timestamp behavior for local-file Scryfall imports in this feature. Distinguishing an
  authoritative Scryfall dataset timestamp from the local file modification time is a separate source-provenance cleanup
  and is out of scope here.

Card Query should retain its existing `legality.{format}` property-path syntax and generalize it over the strict
Scryfall-backed set `commander`, `standard`, `pioneer`, `modern`, `legacy`, `vintage`, and `pauper`. The same set is
valid for `include.legalities`. `legality.casual_60` is invalid because Casual 60 deliberately bypasses source legality,
and other retained Scryfall formats remain internal rather than becoming public Card Query properties. The SQLite
compiler should extract the already-validated suffix and bind it into the existing independent legality `EXISTS` query,
preserving multiple-format predicates, current operators, validation errors, ordering, and Commander behavior.

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

Implementation status (6 August 2026): the first internal slice—Format model, reference imports, deterministic
validation, persistence, Card Query, and rendering—is implemented with deterministic coverage. The methodology and
public agent-integration slice has not begun; Tomekin remains publicly Commander-only.

Adding deterministic format support is not enough to make the agent a strong 60-card deck builder. A later
implementation slice must research authoritative and well-regarded articles, videos, and guides, then convert the stable
findings into a dedicated methodology skill.

The feature should be delivered as at least two implementation slices: first the Format model, reference imports,
deterministic validation, persistence, Card Query, and rendering; then the researched 60-card deck-building methodology
and agent integration. The first slice may merge as internal capability, but Tomekin must remain publicly Commander-only
and the feature must not be considered complete or advertised until both slices are delivered and tested.

The research should preserve broadly stable concepts such as consistency, mana curve, threat density, interaction,
redundancy, card advantage, mana-base construction, and coherent win conditions. The methodology may explain why exactly
60 cards is usually the most consistent choice, but final Mainboard size remains an agent decision informed by the
user's request and deck context rather than an application warning or invariant. Format metagame claims, archetype
positioning, and Sideboard plans are more time-sensitive and should be grounded in appropriately current sources rather
than treated as timeless skill instructions. The permanent methodology must not embed a dated metagame snapshot or rely
silently on model memory; normal offline Sideboard work follows the user-context boundary above.

Use a small, attributable stable corpus rather than a broad scrape. Reid Duke's official Wizards `Level One` course is
the conceptual backbone for archetypes, card advantage, tempo, threats and answers, mana bases, Sideboards, and
Sideboard plans. Frank Karsten's current quantitative 60-card land-count analysis supplies mana-base starting guidance,
not a universal formula. Add another source only when it contributes a distinct, attributable principle not adequately
covered by those anchors. Current tournament decklists may inform explicitly dated evaluation examples, but their card
choices and metagame positions must not become timeless skill rules.

The methodology implementation should include a research manifest recording each source's author, title, URL, access
date, adopted claims, and stable or volatile classification. Source quality matters more than satisfying an artificial
quota of articles, videos, or guides.

For this feature, automated coverage remains deterministic and the developer will manually exercise the existing Tomekin
agent before release. Do not add a live-model evaluation runner, LLM judge, agent test harness, or CI quality score. A
versioned scenario suite with deterministic legality gates and human quality review is a possible future improvement,
not part of this implementation.

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
- recognized-but-disallowed sections producing `illegal`, and unknown section values producing `validation_error`;
- basic and snow basic lands;
- Wastes and nonbasic-land controls proving Basic Land recognition requires `Basic` and `Land` before the type-line
  dash;
- unlimited and numeric Copy Limit Overrides;
- supported unlimited and numeric Oracle-text templates, plus potential copy-limit wording that does not fully match a
  supported template and therefore blocks import;
- migrated Copy Limit Override placeholders remaining unusable until a successful required-revision Oracle Cards
  reimport;
- unrecognized deck-construction wording failing the Oracle Cards import without replacing the previous dataset;
- restricted Vintage cards;
- a Vintage-restricted card whose Copy Limit Override would otherwise permit more than one copy;
- legal, banned, not-legal, missing, and stale legality data;
- Casual 60 bypassing sanctioned legality while preserving construction rules; and
- regression coverage proving Commander eligibility behavior did not change.

Commander eligibility is not one of these decisions; it is explicitly deferred.
