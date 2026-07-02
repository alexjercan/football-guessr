# V3b — Club Crest & Player Art Assets

- STATUS: OPEN
- PRIORITY: 55
- TAGS: assets,ux

## Context

Split out from V3 (`tasks/20260701-185929`), which bundled data enrichment and
art assets. This half is the **content/licensing + wiring** effort: source the
actual crest / photo binaries and plug them into the UI. It builds on the data
shape decided in **V3a** (`tasks/20260702-124105`) — crests key off a stable
club id, photos off the player id, so V3a's id contract should be settled first.

V2 Step 11 (`tasks/20260701-111646`) shipped the hint panel with **placeholder**
crests: a single shared shield SVG (`src/assets/crest-placeholder.svg`) with the
club's initials overlaid. The panel, profile page, and modals are all built to
accept real art with minimal/zero rendering changes — this task wires the real
assets in.

This is deliberately its own task because it's a **content/licensing** effort,
not a code effort. Real club crests and player photos are copyrighted; the
sourcing decision (see "Licensing") must be made before adding binaries.

## What assets are missing

1. **Club crests** (highest impact — the panel is built for these)
   - One image per distinct club referenced in the dataset (Santos, Barcelona,
     Paris Saint-Germain, Al-Hilal, Inter Miami, Sporting CP, Manchester United,
     Real Madrid, Juventus, Al-Nassr, AS Monaco, ...  — grows with the dataset).
   - Format: SVG preferred (crisp at the 40px crest size, small); PNG fallback
     at ~80x80 for crests only available as raster.
   - Maps to a club via the **club id** from V3a (no fuzzy string matching).

2. **Player photos / portraits** (past-guess cards + profile collection)
   - One headshot per player (`neymar`, `messi`, ...), keyed off the player id.
   - Format: square-ish (e.g. 96x96) PNG/WebP, or a silhouette SVG fallback for
     players without a photo. `src/assets/default_icon.svg` can be the fallback.

3. **Player descriptions / bio blurbs** (optional flavor)
   - A short sentence per player to show on the win modal or a detail view.
     (Field is added in V3a; this is the display wiring.)

4. **Club metadata display** (optional)
   - Country / league per club, primary brand color (could tint the crest card
     border instead of the current uniform amber). Nice-to-have.

## Licensing (decide before adding binaries — blocker)

Real club crests and player photos are trademarked/copyrighted. Options, safest
first:
- Keep stylized **placeholder/generic** crests (what we have) — zero risk.
- Commission or generate **original** stylized crest-like icons per club
  (evokes without copying) — low risk, some effort.
- Use a licensed/open dataset (e.g. explicitly CC-licensed logo sets) — verify
  terms cover a public web game.
- Real crests/photos under fair-use/editorial — **highest risk**, likely not OK
  for a public deployment; get sign-off first.

Note: the V2 planning parking lot already lists "Club crest images / any binary
art assets" and "copyrighted crest emoji or club logos" as out of scope — this
task is where that decision gets made deliberately, not by accident.

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
- **Profile "collection carousel"** — deferred in V2 Step 10
  (`tasks/20260701-111645`) precisely because we lacked player portraits/crests.
  Once photos/crests exist, that carousel becomes buildable.
- **Share text (Step 12)** — must stay plain-unicode; do NOT put crest/logo
  emoji or copyrighted marks in shareable text regardless of assets added here.

## Webpack wiring note

Assets imported from TS bundle automatically; assets referenced only from
HTML/JSON need a `CopyPlugin` entry (like `profile.svg`). Add crest/photo dirs
under `src/assets/crests/` and `src/assets/players/` accordingly.

## Checklist

- [ ] Decide licensing / sourcing approach (blocker for everything else)
- [ ] Add crest assets under `src/assets/crests/` (+ webpack copy/import wiring)
- [ ] `panel.ts` `createClubCard`: render real crest, keep initials/placeholder
      as graceful fallback when a crest is missing
- [ ] (Optional) player photos under `src/assets/players/` in `createGuessCard`
      + a profile collection view
- [ ] (Optional) player descriptions on the win modal
- [ ] Keep the placeholder path working for any club/player still lacking art
      (partial datasets must not break the UI)
- [ ] Verify in the real app (`npm run serve` + headless-Chromium screenshots);
      `npm run ci` green

## Depends on / relates to

- Split from V3 (`tasks/20260701-185929`, now closed).
- **Depends on V3a** (`tasks/20260702-124105`) for the stable club-id / player
  schema contract.
- Built on top of V2 Step 11 hint panel (`tasks/20260701-111646`).
- Unblocks the deferred profile collection carousel from V2 Step 10
  (`tasks/20260701-111645`).
