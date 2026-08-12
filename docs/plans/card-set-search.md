# Card Set and Printing Search Plan

## Status

Delivered on 13 August 2026. This plan records the implemented local Card Set discovery, printing-scoped Card Query
predicates, explicit printing existence semantics, and the strict legacy-database upgrade path.

## Goal

Let the Tomekin agent resolve a natural-language Set name to local Scryfall Set metadata and query Card Identities by
their related Card Printings. Normal deck-building remains local and offline: the agent must not maintain a Set list in
a skill or browse the web to resolve current Sets.

## Resolved Decisions

- `CardSet` is reference data derived from the Set fields repeated on every Scryfall `all_cards` Card object. Do not add
  a separate live `GET /sets` request to normal sync or import.
- Persist the complete Set metadata available in `all_cards`: `set_id`, `set`, `set_name`, `set_type`, `set_uri`,
  `set_search_uri`, and `scryfall_set_uri`.
- Preserve Scryfall Set codes exactly as supplied in the bulk file, including lowercase casing. Do not uppercase them
  at rest.
- Use Scryfall Set UUID as stable identity. `card_printing.set_id` is a required foreign key to `card_set.id`;
  `card_set.code` is required and unique. Do not retain a redundant physical `card_printing.set_code` column.
- Continue returning `setCode` where existing repository and Collection-facing results require it by joining
  `card_printing` to `card_set`.
- Store `setType` as required non-empty source text, not a closed enum. The current export contains 24 values, and
  Scryfall may add more without a Tomekin schema migration.
- Secret Lair is not a Set type. Current Secret Lair Sets span `box`, `promo`, and `memorabilia`; resolve Secret Lair
  Set codes through local Set search rather than inferring them from `setType` or a hardcoded skill list.
- Import every source-provided `promo_types` value for each Card Printing into
  `card_printing_promo_type(card_printing_id, promo_type)`. Treat promo types as an extensible non-empty source
  vocabulary, not an enum; the inspected export currently contains 114 distinct values.
- Expose `printing.universesBeyond` as a virtual boolean Card Query property. Evaluate it for one Card Printing by
  testing whether that printing has the `universesbeyond` promo type; do not persist a redundant boolean.
- Strip the query component only from human-facing Scryfall `scryfall_uri` and `scryfall_set_uri` values when mapping
  them to `sourcePageUri`. The current export uses only `utm_source=api` there. Preserve functional query components on
  `set_search_uri`, image URIs, bulk source/download URIs, and other API/search URIs.
- `query_cards` remains rooted at Card Identity and returns each matching Card Identity once. Printing predicates are
  expressed only through explicit `withPrinting` or `withoutPrinting` relationship quantifiers.
- `withPrinting(P)` means at least one related Card Printing satisfies `P`. `withoutPrinting(P)` means no related Card
  Printing satisfies `P`. Predicates within either child scope apply to the same Card Printing and its single joined
  Card Set.
- `withoutPrinting` is the first public negative relationship quantifier. Do not add `withoutTagging` or
  `withoutCollectionCard` in this slice. Continue rejecting ordinary `not` and `!=` outside a printing scope where
  they could be mistaken for relationship anti-existence. Inside a printing scope, allow `not` only over
  single-valued properties of that scoped Printing/Set, such as `printing.setCode`, `printing.setType`, and
  `printing.universesBeyond`; do not allow it directly over the one-to-many `printing.promoType` property.
- The common player meaning of “no Universes Beyond” is: recommend a Card Identity when at least one non-Universes
  Beyond printing is available to acquire. Express this as
  `withPrinting(printing.universesBeyond = false)`. This intentionally retains an identity that has both Universes
  Beyond and Universes Within printings.
- The stricter request “exclude any card that has ever had a Universes Beyond printing” is
  `withoutPrinting(printing.universesBeyond = true)`. The agent must not silently substitute this stricter meaning for
  an ordinary “no Universes Beyond” request.
- Apply the same interpretation to Secret Lair. For ordinary “no Secret Lair” acquisition guidance, resolve the local
  Secret Lair Set codes and use `withPrinting(not(printing.setCode in codes))`, retaining identities with an available
  non-Secret-Lair Printing. Use `withoutPrinting(printing.setCode in codes)` only when the user explicitly wants to
  exclude every identity that has ever appeared in Secret Lair.
- The `query-cards` skill must teach both meanings with contrasting JSON examples and recommend the common
  acquire-an-acceptable-printing interpretation by default for Universes Beyond and Secret Lair. The `query_cards`
  tool description should briefly flag printing constraints and direct the agent to the skill. The primary deck-builder
  already requires loading `query-cards` before non-trivial filters, so the detailed distinction will be available when
  the agent composes these queries.

## Domain and Persistence Changes

Add these domain records:

```ts
type CardSet = {
  id: string;
  code: string;
  name: string;
  setType: string;
  apiUri: string;
  cardSearchUri: string;
  sourcePageUri: string;
};

type CardPrintingPromoType = {
  cardPrintingId: string;
  promoType: string;
};
```

Change `CardPrinting` to carry `setId` instead of stored `setCode`. Extend `CardPrintingImportRecord` with its complete
`CardSet` and promo-type rows so one streamed `all_cards` pass can stage all related data.

Add SQLite tables and constraints:

- `card_set`: UUID primary key, unique non-empty code, required name/type/URI fields.
- `card_printing.set_id`: indexed, non-null foreign key to `card_set.id`.
- `card_printing_promo_type`: composite primary key `(card_printing_id, promo_type)` plus printing index.

Generate the migration with `bun run db:sqlite:migration:generate`; do not handwrite Drizzle migration or metadata
files.

The `all_cards` importer must stage Sets, Printings, finishes, parts, and promo types in one transaction. Repeated Set
metadata is valid only when every field agrees for the same Set UUID. Reject conflicting UUID metadata, one code mapped
to multiple UUIDs, duplicate printing promo types, missing staged Set references, and imports that would orphan owned
Collection rows. Upsert Sets before Printings, replace dependent printing rows transactionally, then remove obsolete
Sets after obsolete Printings are gone. A failure preserves the previous usable reference dataset.

Bump the `all_cards` Import Contract Revision so existing databases require reimport before reference-dependent Agent
Tools run.

## Public Interfaces and Query Semantics

Add `search_card_sets({query?, limit?})` to the card-reference repository and Agent Tools. Search local Set code and name
case-insensitively for discovery, rank exact code then exact name ahead of partial matches, use deterministic name/code
tie-breakers, default to 25, and cap at 100. Return complete `CardSet` records.

Add printing-scope queryables:

- `printing.setCode`: source-faithful lowercase code; supports exact `=` and `in`.
- `printing.setType`: source-defined non-empty text; supports exact `=` and `in`.
- `printing.promoType`: matches a promo-type row on the scoped printing; supports exact `=` and `in`.
- `printing.universesBeyond`: virtual boolean; supports exact `=` only.

Within `withPrinting` or `withoutPrinting`, `not` may wrap predicates composed only from `printing.setCode`,
`printing.setType`, or `printing.universesBeyond`. It remains invalid over `printing.promoType`, because a Printing with
multiple promo types would recreate the row-inequality versus anti-existence ambiguity. Use a dedicated virtual boolean
for any future common promo-type absence query rather than generalizing `promoType != value`.

Set-name discovery belongs in `search_card_sets`; do not add fuzzy Set-name matching to `query_cards`. Normalize
`printing.setCode` query values to lowercase at the Agent Tool/core boundary so human uppercase input such as `HOB`
resolves to stored `hob` without applying `lower()` to indexed database columns.

Examples:

```json
{
  "filter": {
    "op": "withPrinting",
    "args": [
      {"op": "=", "args": [{"property": "printing.setCode"}, "hob"]}
    ]
  }
}
```

After resolving local Secret Lair codes with `search_card_sets`, the common acquisition interpretation is:

```json
{
  "filter": {
    "op": "withPrinting",
    "args": [
      {
        "op": "not",
        "args": [
          {
            "op": "in",
            "args": [{"property": "printing.setCode"}, ["sld", "slc", "slu", "slp", "pssc"]]
          }
        ]
      }
    ]
  }
}
```

```json
{
  "filter": {
    "op": "withPrinting",
    "args": [
      {"op": "=", "args": [{"property": "printing.universesBeyond"}, false]}
    ]
  }
}
```

```json
{
  "filter": {
    "op": "withoutPrinting",
    "args": [
      {"op": "=", "args": [{"property": "printing.universesBeyond"}, true]}
    ]
  }
}
```

Compile printing scopes as correlated `EXISTS`/`NOT EXISTS` subqueries from `card_identity` through `card_printing` and
`card_set`. Compile `printing.universesBeyond` for the currently scoped printing as existence/non-existence of its
`universesbeyond` promo-type row. Do not use joins in the primary result query that duplicate Card Identity rows.

Combining printing and Collection predicates remains identity-level intersection: the identity has a qualifying
printing and independently has qualifying owned Collection rows. Selecting an owned copy from the same qualifying
printing is deferred unless a concrete workflow requires cross-relationship correlation.

## Implementation Slices

1. Add failing core mapping tests for all seven Set fields, lowercase code preservation, promo types, URI cleanup, and
   conflicting repeated metadata; then add the domain/import types and mapping.
2. Add the Drizzle `card_set`, `card_printing.set_id`, and `card_printing_promo_type` schema changes; generate the SQLite
   migration and prove upgrade behavior and foreign-key constraints.
3. Extend staged `all_cards` replacement and repository list reads; bump the import contract; verify success,
   deduplication, conflict rollback, orphan protection, and stale Set removal.
4. Add `searchCardSets` repository behavior, core handler, `search_card_sets` Agent Tool, OpenCode permission, and tool
   schema tests.
5. Add strict Card Query validation for printing queryables and `withPrinting`/`withoutPrinting`, followed by SQL-backed
   repository behavior.
6. Update `query-cards`, the primary agent/tool descriptions, `CONTEXT.md`, data-model/MVP/testing documentation, and
   README where user-visible sync/reimport behavior changes.
7. Run targeted tests, full `bun test`, and `bun run typecheck`.

## Required Test Scenarios

- Set import deduplicates identical metadata across many Printings and rejects every conflict class transactionally.
- Card Printing foreign keys use Set UUID while repository projections still return lowercase Set code.
- Source-page URIs lose tracking queries; Set search, image, API, and bulk-source URIs retain functional queries.
- Set discovery covers partial name, upper/lowercase code input, exact-match ranking, deterministic ordering, and limits.
- `withPrinting(setCode = hob)` returns each matching identity once, including identities with multiple HOB Printings.
- `withPrinting(universesBeyond = false)` retains an identity with both UB and non-UB Printings and excludes an identity
  with only UB Printings.
- `withoutPrinting(universesBeyond = true)` excludes an identity with any UB Printing, even when it also has a non-UB
  Printing.
- Secret Lair guidance resolves codes locally; scoped `not(in(...))` retains identities with a non-Secret-Lair
  Printing, while `withoutPrinting(in(...))` enforces the stricter never-printed-in-Secret-Lair interpretation.
- Promo-type predicates remain scoped to the same Printing as Set predicates within one `withPrinting` child.
- Validation rejects printing predicates outside a printing scope, unsupported operators, nested relationship scopes,
  and `not` over `printing.promoType`; scoped `not` over single-valued Printing/Set properties remains valid.
- Printing-only filters do not imply Collection ownership, and mixed printing/Collection filters retain independent
  identity-level semantics.

## Assumptions and Deferred Scope

- The local Set catalog contains Sets represented by at least one Card object in the imported `all_cards` snapshot;
  announced Sets with no cards in that snapshot are absent.
- Complete Set objects from live `GET /sets`, including parent Set, release, icon, card-count, and digital/foil metadata,
  remain out of scope because those fields are not present in `all_cards`.
- Printing result projection and exact owned-copy selection by printing are deferred. This slice adds filtering and Set
  discovery without changing the Card Identity-grouped result envelope.
- Generic negative quantifiers for other relationship families remain deferred until their own workflows justify the
  semantics.
