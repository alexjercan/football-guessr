# V3 — Club Crest & Player Art Assets + Richer Player Data

- STATUS: CLOSED
- PRIORITY: 55
- TAGS: assets,data,ux

## Resolution — split into two tasks (2026-07-02)

Closed without direct implementation. Split into two separately-tracked tasks so
the data work and the content/licensing+art work can proceed independently:

- **V3a — Richer Player Data & Club-as-Entity Data Shape**
  (`tasks/20260702-124105`) — dataset shape change, club ids, expanded player
  pool, loader/types updates. Prerequisite for V3b.
- **V3b — Club Crest & Player Art Assets** (`tasks/20260702-124044`) —
  licensing/sourcing decision, crest + photo binaries, panel/profile wiring.

See those tasks for the up-to-date checklists; the sections below are the
original combined write-up kept for reference.

## Context

V2 Step 11 (`tasks/20260701-111646`) shipped the hint panel with **placeholder**
crests: a single shared shield SVG (`src/assets/crest-placeholder.svg`) with the
club's initials overlaid. The panel, profile page, and modals are all built to
accept real art with minimal/zero rendering changes — this task is about
sourcing the actual assets + data and wiring them in.

This is deliberately parked as its own task because it's a **content/licensing**
effort, not a code effort. Real club crests and player photos are copyrighted;
we need to decide sourcing (see "Licensing" below) before adding binaries.

## What data/assets are currently missing

The dataset (`src/data/players.json`) is minimal today — each player is just
`{ id, name, clubs: string[] }` and clubs are bare strings. To make the panel /
profile / results richer we'd want:

1. **Club crests** (highest impact — the panel is built for these)
   - One image per distinct club referenced in `players.json`
     (Santos, Barcelona, Paris Saint-Germain, Al-Hilal, Inter Miami,
     Sporting CP, Manchester United, Real Madrid, Juventus, Al-Nassr,
     AS Monaco, ... — grows with the dataset).
   - Format: SVG preferred (crisp at the 40px crest size, small); PNG fallback
     at ~80×80 for crests only available as raster.
   - Needs a stable **club id** so a crest maps to a club without fuzzy string
     matching. Today clubs are plain strings inside each player; promoting them
     to `{ id, name, crest }` (see "Data-shape change" below) is the clean fix.

2. **Player photos / portraits** (for past-guess cards + profile collection)
   - One headshot per player (`neymar`, `messi`, ...). The player `id` already
     exists, so these key off it directly.
   - Format: square-ish (e.g. 96×96) PNG/WebP, or a silhouette SVG fallback for
     players without a photo. `src/assets/default_icon.svg` can be the fallback.

3. **Player descriptions / bio blurbs** (optional flavor)
   - A short sentence per player (nationality, position, a fun fact) to show on
     the win modal or a player detail view. Purely additive.

4. **Club metadata** (optional)
   - Country / league per club, primary brand color (could tint the crest card
     border instead of the current uniform amber). Small, nice-to-have.

## Data-shape change (enables 1 & 4 cleanly)

Today: `clubs: string[]`. Proposed: clubs become referenceable entities.

```jsonc
// players.json entry
{
  "id": "messi",
  "name": "Lionel Messi",
  "photo": "assets/players/messi.webp",      // optional; falls back to silhouette
  "description": "Argentine forward, 8× Ballon d'Or.", // optional
  "clubs": ["barcelona", "psg", "inter-miami"] // club *ids*, not display strings
}

// new clubs.json (or a "clubs" map alongside players)
{
  "barcelona": { "name": "Barcelona", "crest": "assets/crests/barcelona.svg", "country": "ES" },
  "psg":       { "name": "Paris Saint-Germain", "crest": "assets/crests/psg.svg", "country": "FR" }
}
```

This is a breaking change to `src/data/players.json` and its loader
(`src/dataLoader.ts` maps `RawPlayerEntry` → `PlayerEntry`). Must be done in
lockstep:
- `src/types.ts`: `PlayerEntry.clubs` stays `string[]` at the *game-logic* layer
  (the reducer only needs display names) **or** introduce a `Club` type — decide
  based on whether game logic ever needs club ids. Minimizing churn: keep the
  game reducer on display strings, resolve ids → display names + crests in the
  loader/UI layer only.
- `src/matching.ts` is unaffected (matches on player names, not clubs).
- Regenerate/expand the dataset — the current 4 players are a smoke-test set,
  not a real puzzle pool.

## Wiring points already prepared (what real assets plug into)

- **Crest, hint panel** — `src/ui/panel.ts` `createClubCard(name, latest)`:
  today builds a `<div class="hint-card__crest">` containing the shared
  placeholder `<img src={crestPlaceholder}>` + an initials `<span>`. Swap to the
  per-club crest URL and drop (or keep as fallback) the initials overlay. CSS
  classes `.hint-card__crest` / `.hint-card__crest-img` /
  `.hint-card__crest-initials` already exist in `src/style.css`.
- **Player photo, past-guess cards** — `src/ui/panel.ts` `createGuessCard(name)`
  is name-only by design (V2 decision). Add an avatar `<img>` here; there's no
  placeholder avatar clutter to remove.
- **Profile "collection carousel"** — was explicitly deferred in V2 Step 10
  (`tasks/20260701-111645`) precisely because we lacked player portraits/crests.
  Once photos/crests exist, that carousel becomes buildable.
- **Share text (Step 12)** — must stay plain-unicode; do NOT put crest/logo
  emoji or copyrighted marks in shareable text regardless of assets added here.

## Licensing (decide before adding binaries)

Real club crests and player photos are trademarked/copyrighted. Options, safest
first:
- Keep stylized **placeholder/generic** crests (what we have) — zero risk.
- Commission or generate **original** stylized crest-like icons per club
  (evokes without copying) — low risk, some effort.
- Use a licensed/open dataset (e.g. explicitly CC-licensed logo sets) — verify
  terms cover a public web game.
- Real crests/photos under fair-use/editorial — **highest risk**, likely not OK
  for a public deployment; get sign-off first.

Note: the V2 planning doc's parking lot already lists "Club crest images / any
binary art assets" and "copyrighted crest emoji or club logos" as out of scope —
this task is where that decision gets made deliberately, not by accident.

## Checklist

- [ ] Decide licensing / sourcing approach (blocker for everything else)
- [ ] Decide data shape: promote clubs to ids + a `clubs` map, or keep strings
      and map display-name → crest in a side table
- [ ] Add crest assets under `src/assets/crests/` (+ webpack copy/import wiring;
      note: assets imported from TS bundle automatically, assets referenced only
      from HTML/JSON need a `CopyPlugin` entry like `profile.svg`)
- [ ] Update `src/data/players.json` + `src/dataLoader.ts` + `src/types.ts`
      together; expand the player pool beyond the 4-player smoke set
- [ ] `panel.ts` `createClubCard`: render real crest, keep initials/placeholder
      as graceful fallback when a crest is missing
- [ ] (Optional) player photos in `createGuessCard` + a profile collection view
- [ ] (Optional) player descriptions on the win modal
- [ ] Keep the placeholder path working for any club/player still lacking art
      (partial datasets must not break the UI)

## Depends on / relates to

- Built on top of V2 Step 11 hint panel (`tasks/20260701-111646`).
- Unblocks the deferred profile collection carousel from V2 Step 10
  (`tasks/20260701-111645`).
