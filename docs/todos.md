# Todos

Authored and edited only by osmall, not agents.

## List

- figure out schema.ts ```.default(sql`'[]'`)```
- use T3.env for environment variables
- explore defined roles on DeckCandidateCard e.g. "payoff" or "enabler"
- refine agent and skills to follow better deck building practices
- scryfall import from remote
- add timeout to card query
- make `tomekin_save_deck_candidate` quicker
- prevent portable decklist from printing in deck_candidate.markdown
- add a way to save user context about how to handle the collection
  - e.g. Don't use the collection-stored basic lands when building decks. Pretend there is an infinite supply of basic
    lands.
- Make better use of .jsonl Scryfall files i.e. stream them to save memory
- Make deck candidate updates much faster. Right now, a 3 card substitution update takes like 6 mins; unacceptable.
- Bring back event logging in the scryfall sync. Right now, we're a bit in the dark as to the progress.
- Clean up `db:sqlite:migration:prepare-card-set-search`
- Rename skills to make more sense e.g. tomekin-deck-building -> tomekin-orchestrator or something