# V3a — Richer Player Data & Club-as-Entity Data Shape

- STATUS: OPEN
- PRIORITY: 56
- TAGS: data,ux

## Context

Split out from V3 (`tasks/20260701-185929`), which bundled data enrichment and
art assets. This half is the **data** effort: promote the minimal dataset to
something richer and give clubs stable identities. It is a prerequisite for the
art-assets half (`V3b`) — crests need a stable club id to key off, and photos
key off the player id.

The dataset (`src/data/players.json`) is minimal today — each player is just
`{ id, name, clubs: string[] }` and clubs are bare display strings. The current
4 players are a smoke-test set, not a real puzzle pool.

## What data is currently missing

1. **Stable club ids.** Clubs are plain strings inside each player. Promoting
   them to referenceable entities (`{ id, name, ... }`) removes fuzzy
   string-matching when V3b maps a crest to a club.
2. **Player photo/description fields** (schema only in this task — the actual
   binaries land in V3b). Add optional `photo` / `description` fields so the
   shape is ready; leaving them unset must fall back gracefully.
3. **A real player pool.** Expand well beyond the 4-player smoke set.

## Data-shape change

Today: `clubs: string[]`. Proposed: clubs become referenceable entities.

```jsonc
// players.json entry
{
  "id": "messi",
  "name": "Lionel Messi",
  "photo": "assets/players/messi.webp",      // optional; falls back to silhouette (V3b)
  "description": "Argentine forward, 8x Ballon d'Or.", // optional
  "clubs": ["barcelona", "psg", "inter-miami"] // club *ids*, not display strings
}

// new clubs.json (or a "clubs" map alongside players)
{
  "barcelona": { "name": "Barcelona", "crest": "assets/crests/barcelona.svg", "country": "ES" },
  "psg":       { "name": "Paris Saint-Germain", "crest": "assets/crests/psg.svg", "country": "FR" }
}
```

This is a breaking change to `src/data/players.json` and its loader
(`src/dataLoader.ts` maps `RawPlayerEntry` -> `PlayerEntry`). Must be done in
lockstep:
- `src/types.ts`: `PlayerEntry.clubs` stays `string[]` at the *game-logic* layer
  (the reducer only needs display names) **or** introduce a `Club` type — decide
  based on whether game logic ever needs club ids. Minimizing churn: keep the
  game reducer on display strings, resolve ids -> display names (+ crests, in
  V3b) in the loader/UI layer only.
- `src/matching.ts` is unaffected (matches on player names, not clubs).
- **Storage safety:** the saved-game / stats `localStorage` schema replays
  guesses against a player (`gameStats.ts`). Changing the dataset shape must not
  orphan existing saved games — verify the loader still produces the display
  strings the reducer and stats layer expect (see AGENTS.md safety note).
- Regenerate/expand the dataset beyond the 4-player smoke set.

## Checklist

- [ ] Decide data shape: promote clubs to ids + a `clubs` map, or keep strings
      and map display-name -> crest in a side table (this decision also unblocks
      V3b — coordinate the club-id contract with it)
- [ ] Add optional `photo` / `description` fields to the player schema (binaries
      land in V3b; unset must fall back gracefully)
- [ ] Update `src/data/players.json` + `src/dataLoader.ts` + `src/types.ts`
      together; expand the player pool beyond the 4-player smoke set
- [ ] Keep the game reducer / matching / stats replay working against the new
      shape; do not break existing saved games
- [ ] `npm run ci` green (extend `dataLoader` tests for the new shape)

## Depends on / relates to

- Split from V3 (`tasks/20260701-185929`, now closed).
- **Unblocks V3b art assets** (`tasks/20260702-124044`) — that task needs the
  stable club id contract decided here.
- Built on top of V2 Step 11 hint panel (`tasks/20260701-111646`).
