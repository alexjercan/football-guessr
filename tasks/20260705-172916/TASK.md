# Expand player pool — wave 2 (~130 total, web-verified)

- STATUS: OPEN
- PRIORITY: 90
- TAGS: data,gameplay,content

## Goal

Continue the pool expansion begun in wave 1 (`20260705-172932`): grow
`src/data/data.json` from ~80 players to **~130 players total** by adding a
second wave of ~50 famous, **web-verified** footballers. This delivers the
overall goal: a ~130-player pool for decent gameplay variety.

**Depends on wave 1 (`20260705-172932`) being CLOSED/merged first** — this
branch is cut after wave 1 lands so it builds on the already-expanded dataset.

"Done" = ~130 players in `data.json`, every new player's club order
web-verified, `npm run ci` green (integrity + legacy-lock tests), game plays
with the full pool.

## Same constraints as wave 1

All the rules in `20260705-172932` apply verbatim — read that task's
"Context / constraints" and "Data-quality rules" sections. In particular: club
id == slugified name, referential integrity, legacy four untouched, stable slug
ids, chronological club order, `photo`/`description`/`crest` unset, web-verify
every player, reuse existing club ids (no near-duplicate slugs), add `country`
for new clubs.

## Wave-2 specifics

- **Apply wave 1's retro lessons** (`docs/retros/`) before authoring — fix any
  systematic mistakes wave 1 surfaced (slug pitfalls, country codes, dup clubs,
  research workflow) so wave 2 does not repeat them.
- **No duplicate players:** cross-check against the players already present
  after wave 1 before adding a candidate.
- Second wave can reach a little deeper (well-known players from more leagues
  and eras) while still staying recognizable, to maximize variety toward ~130.

## Steps

- [ ] Sprout the task worktree/branch off the post-wave-1 default branch; set
      STATUS -> IN_PROGRESS.
- [ ] Read wave 1's retro and note the lessons to apply.
- [ ] Inventory the current players + clubs (post wave 1) to avoid duplicates and
      reuse club ids.
- [ ] Assemble ~50 additional famous candidates not already in the pool.
- [ ] Web-verify each candidate's career club sequence.
- [ ] Author new `players` + any new `clubs` entries (same shape/rules as wave 1).
- [ ] Throwaway validation pass (slug==id, referential integrity, near-dup club
      slug scan) in OS temp dir.
- [ ] `npm run ci` green; fix failures.
- [ ] Confirm in the running app that the full pool loads and sample players
      resolve correctly.
- [ ] Update this TASK.md "What changed" + STATUS -> CLOSED when the PR merges.

## What changed

_(fill in on completion: final total player count, notable decisions, PR link)_
