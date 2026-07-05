# Expand player pool — wave 1 (~80 players, web-verified)

- STATUS: IN_PROGRESS
- PRIORITY: 95
- TAGS: data,gameplay,content

## Goal

Grow the committed puzzle dataset (`src/data/data.json`) from the current 32
players to **~80 players** by adding ~48 new, globally famous footballers, each
with a **web-verified** career club sequence. This is wave 1 of a two-wave push
toward ~130 players total (wave 2 = `20260705-172916`).

"Done" = ~80 players in `data.json`, every new player's club order confirmed
against a reliable source, `npm run ci` green (including the dataset-integrity
and legacy-lock tests), and the game still plays with the larger pool.

## Context / constraints (from AGENTS.md + tests)

- `data.json` has two maps keyed by stable slug id: `players`
  (`id -> { name, clubs: [clubIds] }`) and `clubs`
  (`id -> { name, country?, crest? }`). A player references clubs by id; the
  loader resolves ids -> display names.
- **Club id MUST equal the slugified display name** (lowercase, diacritics
  stripped, non-alphanumerics -> single hyphen). `test/data.test.ts` enforces
  this exactly — a drifted id fails the build.
- **Referential integrity:** every club id a player references must exist in the
  `clubs` map. Enforced by test.
- **Legacy lock:** `neymar`, `messi`, `ronaldo`, `mbappe` must keep their ids
  and exact resolved club sequences (test locks them). Do not touch them.
- **Saved-game safety:** player ids are storage keys and club order is replayed
  by stats — pick a stable slug id per new player and keep club order in true
  career chronology. Once added, do not later rename/reorder.
- Player `photo`/`description` and club `crest` are optional and stay **unset**
  (that is V3b art-asset work, out of scope here). Clubs render as initials.
- No app-code change is needed: daily/practice pick from the players array via
  seeded RNG; a bigger pool just increases variety.

## Data-quality rules for new entries

- **Famous-first:** iconic legends + top current stars whose careers are widely
  recognizable (best for guessability). Avoid obscure players in wave 1.
- **Club sequence = senior career, in chronological order.** Include notable
  loan spells only when they are a well-known part of the career; keep it to the
  clubs a fan would list. Re-joining a club later appears twice in order (see
  `ronaldo` -> Manchester United twice) — that is intended.
- **Web-verify every player** (per user decision). Confirm the club list AND
  their order from a reliable source before committing the entry.
- Use canonical English display names for clubs; reuse existing club ids where
  the club already exists (check the `clubs` map first to avoid near-duplicate
  slugs like `inter` vs `inter-milan`). Add `country` (ISO-3166 alpha-2, e.g.
  `IT`, `ES`, `BR`) for every new club, matching the style of existing entries.

## Steps

- [x] Sprout the task worktree/branch (flow does this) and set STATUS -> IN_PROGRESS.
- [x] Inventory existing club ids/names so new entries reuse them consistently.
- [x] Assemble a candidate list of ~48 famous players for wave 1 (mix of eras
      and leagues, but weighted to recognizable names).
- [x] Web-verify each candidate's career club sequence (fan out research; record
      the verified sequence per player).
- [x] Author the new `players` entries (stable slug id, canonical name, ordered
      club id list) and every new `clubs` entry (slug id, name, country).
- [x] Write a throwaway validation pass (OS temp dir) that checks slug==id and
      referential integrity, plus scans for accidental near-duplicate club slugs.
- [x] `npm run ci` green (format, lint, coverage + data tests). Fix any failures.
- [x] Confirm in the running app (`npm run serve`) that Daily/Practice load and a
      few new players resolve their club paths correctly.
- [ ] Update STATUS -> CLOSED when the PR merges (stays IN_PROGRESS until then).

## What changed

- Added **52 new players** (32 -> **84 total**) and **78 new clubs** (62 -> **140
  total**) to `src/data/data.json`. Wave-1 set is famous-first: legends (Pelé,
  Maradona, Ronaldo R9, Ronaldinho, Zidane, Henry, Beckham, Gerrard, Lampard,
  Rooney, Xavi, Iniesta, Casillas, Raúl, Torres, Villa, Xabi Alonso, Piqué,
  Puyol, Eto'o, Kaká, Pirlo, Totti, Maldini, Del Piero, Buffon, Shevchenko,
  Batistuta, Drogba, van Nistelrooy, Bergkamp, Roberto Carlos, Owen, Ferdinand,
  Tevez, Robben, van Persie, Sneijder, Forlán, James Rodríguez) plus current
  stars (Bellingham, Saka, Foden, Bruno Fernandes, Ødegaard, Leão, Osimhen,
  Lautaro, Julián Álvarez, Pedri, Rodri, Alexander-Arnold).
- Each career club sequence was **web-verified** via 5 parallel research agents;
  clubs are in true chronological order (re-joins listed twice).
- **Collision handling:** the Brazilian Ronaldo got id `ronaldo-nazario` to avoid
  clashing with Cristiano's locked `ronaldo`. Canonicalized agent names to reuse
  existing club ids (Monaco -> AS Monaco, Groningen -> FC Groningen, Hamburg ->
  Hamburger SV, Wolfsburg -> VfL Wolfsburg).
- Legacy four untouched; `npm run ci` green (140 tests), production build OK.
- PR: https://github.com/alexjercan/football-guessr/pull/8 (open; task stays IN_PROGRESS until merge).
