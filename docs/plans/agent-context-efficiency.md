# Agent Context Efficiency

## Status

Deferred improvement plan created on 9 August 2026. The deck-workflow rebuild adopts staged bounded Card Query retrieval
now; the remaining items require separate design and implementation.

## Goal

Give the deck-building agent complete relevant coverage without repeatedly placing all raw Collection, tag, printing,
Brief, and Deck Candidate data into the working context at once. Do not treat a larger output cap as the primary fix.

## Observed Failure Mode

OpenCode bounds tool output by rendered lines and bytes. When a result exceeds those bounds, the complete result may be
written to a spill file while only a truncated prefix and path remain in conversation. The Tomekin deck-building agent
cannot recover that file because normal file reading, grep, and shell access are intentionally denied. Raising the
output cap would increase context use without fixing the mismatch between broad retrieval and bounded agent context.

The reviewed failed session contained repeated broad queries, detailed tag and Collection projections, and repeated full
Brief/deck payloads. Card data is intrinsically verbose, but a roughly 200,000-token working context is not an
inevitable requirement for ordinary deck building.

## Adopted Immediately

- Resolve one positive Collection Location allow-list and reuse it instead of reconstructing scope inconsistently.
- Use broad Card Query limits of roughly 20-50 and split discovery by functional package, tag concept, or Mana Value
  band when a result reaches its limit.
- Keep full tag and Collection Card projections off broad scans.
- Hydrate detailed tags and physical-copy evidence only for strategic shortlists and final assembly checks.
- After a direction is confirmed, starting a fresh task with the compact confirmed Brief is an acceptable interim
  recovery when the current conversation is already dominated by discovery output. The product should eventually manage
  working state without requiring this manual reset.

Card Query has no pagination, so bucketed searches mitigate but do not guarantee exhaustive scans when a bucket itself
exceeds the maximum.

## Priority Follow-on Improvements

### Compact projections

- Add an explicit compact discovery projection containing identity, name, Mana Value, type line, concise Oracle text,
  Color Identity, scoped quantity, and only requested match evidence.
- Return matched tag and strength evidence without every direct and Inherited Card Identity Tag.
- Keep strategic-interest retrieval separate from physical-copy proof.
- Avoid returning every direct and Inherited Card Identity Tag when only the matching concept and strength are needed.

### Recoverable pagination and truncation

- Design stable cursor semantics over deterministic Card Query ordering.
- Return next-cursor and completion metadata so the agent can distinguish a complete result from a bounded page.
- Make any adapter-side truncation recoverable through a supported tool path rather than an inaccessible spill file.

### Stored working state

- Introduce an opaque working-candidate identifier after the workflow proves what state must persist temporarily.
- Let resolve, validate, evaluate, render, and save operate on stored candidate state instead of resending the full
  Brief and decklist through every call.
- Preserve explicit refresh and Collection provenance semantics; hidden active Collection policy is still undesirable.

### Workflow-aware retrieval

- Query by functional package or Mana Value bucket instead of dumping the entire eligible Collection.
- Return explicit completion metadata so reaching a limit cannot silently hide the tail.
- Let later lifecycle steps refer to the confirmed Brief and candidate state without repeating both in full.

### Payload and logging hygiene

- Avoid requesting `tags` and `collectionCards` together for broad result sets.
- Avoid repeating full tool payloads in model context when a compact reference is enough.
- Preserve structured size/timing logs while keeping production logs free of complete tool payloads and outputs.

## Evaluation

Measure tool-result bytes, input tokens, truncation count, number of repeated final-card/Brief payloads, and whether the
agent can prove complete coverage. Optimise only after capturing representative discovery, construction, and tuning
traces; do not trade away correctness or Collection-scope evidence for smaller prompts.
