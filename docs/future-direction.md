# Future Direction

This document captures possibilities outside the current [Product Scope](./product-scope.md) and
[Product Behavior](./product-behavior.md). These items are not current requirements or shipped behavior unless a later
decision promotes them into scope.

## Collection Import

The MVP supports ManaBox collection CSV exports only. Future work may add support for other collection export formats and source systems.

Future import work should preserve the generic Collection model rather than coupling the product to one source format.

Future work may add separate Existing Deck imports if collection exports do not provide enough metadata to infer Existing Decks reliably.

More specialised import/export formats may be needed later for exact collection or printing metadata. [MTGGoldfish supported import formats](https://www.mtggoldfish.com/help/import_formats) is one example of format variance to consider.

## Adjacent Card Groups

The supported 60-card Constructed workflow can build a Sideboard when the user requests one. Maybeboards, considering
boards, upgrade boards, and budget alternative boards remain separate future scope.

The MVP Portable Decklist should remain final-deck-only. Future work may introduce separate structures for adjacent card groups without polluting the importable decklist.

## Persistence History

The MVP treats saved Deck Opportunities and Deck Candidates as mutable records.

Future work may add versioning, undo, historical revision browsing, or comparison across revisions. This should not complicate the MVP persistence model.

Future persistence work may also retain historical Collection snapshots. The MVP only needs import timestamps for freshness checks.

Future persistence work may introduce a first-class `DeckBuildingProject` (or equivalent deck-building task aggregate)
that owns the Format, confirmed Deck Building Brief revisions, and Collection provenance. Multiple Deck Candidates could
reference the exact Brief revision they were built against instead of each embedding an independently mutable copy. This
would make the distinction between requested intent and produced candidates explicit, while supporting variants,
iteration, and historical comparison. The 60-card Constructed feature should keep the current embedded Brief model and
make only the minimal duplication cleanup needed for strict multi-format support.

Structured Deck Candidate data should become the source of truth for rendering. Future persistence work should reduce or
remove the current full Markdown snapshot, especially the duplicated Portable Decklist, and render derived Markdown and
decklist text from Deck Candidate fields and card rows instead of trusting previously saved agent-authored text. Only
analysis that cannot be derived from the structured candidate should need its own persisted representation. This
redesign is deferred from the 60-card Constructed feature.

## Rules Judging

The MVP requires rules awareness, not full rules judging.

Future work may add deeper rules support, including comprehensive rule citations, detailed interaction adjudication, and judge-style explanations.

Legality Assessments currently use descriptive free-text reasons and warnings because the agent can consume them
directly. Future work may introduce stable structured finding codes and typed context when a concrete UI, analytics,
localization, or automated-remediation consumer needs them.

## Meta Analysis

Competitive meta analysis is not core MVP scope.

Future work may add format metagame tracking, tier lists, tournament results, trending archetype analysis, and stronger competitive calibration, especially for non-Commander formats.

## Pricing And Finance

The MVP includes price awareness for missing-card budgeting, not price tracking or MTG finance.

Future work may add price history, market trends, speculation support, buylist optimisation, collection valuation, and broader MTG finance analysis.

## Collection Management

The MVP is read-only with respect to Collection state.

Future work may explore write-back, source-system sync, deck registration, binder updates, or collection-management workflows. These should remain separate from the MVP's collection-first deck-building promise unless deliberately promoted into scope.

## User Interface

The MVP should preserve structured saved Deck Opportunities and Deck Candidates so they can be accessed later outside the original agent conversation.

Future work may add a richer user interface over saved opportunities, deck candidates, refresh status, import summaries, and deck-building workflows.

Future UI work may parse or wrap the MVP's structured Markdown output. Stable headings, sections, and repeated fields in MVP output are intended to keep that path open without defining UI architecture now.

## Agent Quality Evaluation

The default automated suite remains deterministic. Tomekin now keeps a versioned manual Deck Opportunity,
fresh-construction, and tuning scenario corpus outside `bun test`, with deterministic legality and Collection-scope
gates plus human review of behavioural invariants.

Future work may add an opt-in runner around that corpus. Do not introduce a separate judging agent, LLM-as-judge score,
or CI threshold without evidence that the added machinery produces reliable decisions.

## Agent Context Efficiency

The current workflow uses bounded staged Card Queries and hydrates detailed tag or physical-copy evidence only for
shortlists. Follow-on compact projections, pagination, recoverable truncation, stored working-candidate identifiers, and
lifecycle payload deduplication are recorded in
[`plans/agent-context-efficiency.md`](./plans/agent-context-efficiency.md).

## Format Expansion

Tomekin supports Commander/EDH and the paper-first 60-card Constructed family: Standard, Pioneer, Modern, Legacy,
Vintage, Pauper, and Casual 60. The 60-card workflow includes Format-specific construction and legality, optional
requested Sideboards, and a researched agent methodology for building cohesive decks. Detailed settled scope and
implementation history are recorded in [`plans/60-card-constructed.md`](./plans/60-card-constructed.md).

Project language and requirements should remain Format-extensible so later work can support other MTG Formats without
rewriting the product concept. Additional Formats, Arena-first workflows, and live metagame services remain future work
unless separately promoted into scope.

## Protected Collection Metadata

The MVP handles protected, sentimental, display, trade, or otherwise excluded cards through the Collection Access Policy.

Future import sources may expose first-class metadata for protected cards. If so, the Collection Access Policy should be able to incorporate that metadata without turning the product into a full collection management system.

Future protected-card workflows may cover sentimental, display, trade, high-value, altered, damaged, or otherwise excluded cards as first-class use cases.

## Technology And Architecture

The MVP was delivered as local opencode tooling over a TypeScript portable core running on Bun. That kept the first
implementation small while preserving a path to a later web-based, multi-user hosted product.

Database, AI model provider, repository architecture, user interface shape, hosting, and deployment strategy remain otherwise deferred.

Those decisions should be made when the product requirements are clearer.
