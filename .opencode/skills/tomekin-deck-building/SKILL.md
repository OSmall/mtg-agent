---
name: tomekin-deck-building
description: Use when building or revising an MTG Deck Candidate with Tomekin tools, Deck Building Brief confirmation, format-methodology skill loading, validation, rendering, persistence, and imported-Collection awareness.
---

# Tomekin Deck Building

Use this workflow to coordinate local deck-building through Tomekin tools. This skill is the canonical source for the
tool lifecycle. Format-specific construction and tuning methodology belongs in format skills such as
`commander-deck-architecture` and `commander-deck-tuning`.

## Workflow

1. Check `summarize_reference_support`. Missing `oracle_cards`, `all_cards`, or `oracle_tags` blocks local
   deck-building.
2. Draft a best-effort Deck Building Brief from the user's request with `draft_deck_building_brief`.
3. Ask the user to confirm or edit the brief before substantial discovery or full Deck Candidate construction.
4. Load the format methodology skill after the brief is confirmed.
5. Use `query_cards`, `search_card_identity_tags`, and `get_card_identity` to assemble coherent packages, not isolated
   staples. Load the `query-cards` skill before composing non-trivial `query_cards` filters or after validation errors.
6. Resolve proposed final names with `resolve_decklist_cards` before validation or persistence.
7. Validate deterministic format construction with `validate_format_legality`.
8. Run `evaluate_deck_candidate` for aggregate legality, Format-appropriate power context, mana curve, Mainboard land
   count, and Collection caveats.
9. Revise weak areas for up to three full evaluation passes.
10. Render Markdown and Portable Decklist with `render_deck_candidate`.
11. Save the final candidate with `save_deck_candidate` only after final cards resolve cleanly and caveats are
    represented
    in the Markdown.

## Format Methodology Skills

- For Commander/EDH, load `commander-deck-architecture` after the Deck Building Brief confirms `format: commander` or an
  equivalent Commander/EDH intent.
- For Standard, Pioneer, Modern, Legacy, Vintage, Pauper, or Casual 60, load
  `sixty-card-constructed-deck-architecture` after the Deck Building Brief confirms the exact Format.
- For a confirmed Commander Existing Deck or Deck Candidate request involving additions, cuts, swaps, upgrades, or
  improvement, load `commander-deck-tuning`. It determines whether a concise tuning context is enough for a candidate
  review or an open review needs a confirmed tuning brief and explicit Addition Pool.
- If the requested Format is unsupported by local tools or no methodology skill exists, say so directly and ask whether
  the user wants a best-effort unsupported build.
- Do not duplicate format-specific construction or tuning heuristics here. Keep Commander role-density targets, tag
  snowballing, mana-base heuristics, and win-path methodology in `commander-deck-architecture`; keep change proposals,
  role diagnosis, and tuning-specific persistence boundaries in `commander-deck-tuning`.

Deck-building quality bar:

- State a clear game plan and expected play experience.
- Include enough enablers, payoffs, mana support, interaction, card advantage, and resilience for the confirmed brief.
- Use Commander Brackets and Game Changer counts for Commander power language. Use the Brief's Format-relative Power
  Level and expected play context for 60-card Constructed; do not translate it into Commander terms.
- Treat local Oracle Tags as useful source-backed evidence, not infallible truth.
- Use direct and Inherited Card Identity Tags as first-class package-discovery evidence; follow the format methodology
  skill for tag interpretation.
- Label likely tutors, fast mana, extra turns, mass land denial, stax, prison, or combo risks when local text, tags, or
  annotations support them.
- Use `query_cards` for Card Identity, legality, tag, and Collection card retrieval. Use the `query-cards` skill for
  filter syntax and examples. Use `list_collection_locations` only to discover exact Collection Location names for query
  predicates. Do not treat cards as Missing until Collection evidence has been checked or explicitly marked unavailable.
- Treat category counts, card roles, and package membership as agent scratch analysis or Deck Candidate Markdown unless
  deterministic tools return structured data for them.
- Do not claim support for gameplay simulation, opening-hand analysis, or goldfishing. If those would matter, label them
  as unsupported caveats.
- A Deck Change Proposal is non-persisted analysis. Build a revised Deck Candidate only after explicit acceptance, and
  save it only after a separate confirmation of the exact final Change Summary and deterministic revalidation.
- Treat saved Deck Candidates as mutable. When persisting accepted tuning changes, pass the source candidate's ID to
  `save_deck_candidate` so it updates in place. Omit the ID only for an imported Existing Deck or when the user
  explicitly requests a new candidate, copy, or variant.
