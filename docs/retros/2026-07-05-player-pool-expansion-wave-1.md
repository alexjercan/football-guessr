---
date: 2026-07-05
task: tasks/20260705-172932
title: Expand player pool — wave 1 (32 -> 84 players)
tags: [data, content, agents, research]
---

# Retro — Player pool expansion, wave 1

## What we did

Grew `src/data/data.json` from 32 to 84 players (+52) and 62 to 140 clubs (+78),
each career web-verified. Fanned out 5 parallel research agents (~10 players
each) that returned strict JSON `{name, clubs:[{name,country}]}`, then merged via
a small Node script that slugifies club ids, reuses existing clubs, and applies
player-id overrides. Audited accuracy with 2 adversarial web-verify agents.

## What went well

- **Parallel research agents + strict JSON contract.** Asking each agent to
  return only a JSON array (no prose) made assembly mechanical. 5 agents covered
  52 players in ~1.5 min wall-clock.
- **A merge script instead of hand-editing JSON.** `merge.js` computed club ids
  by the exact same slugify rule the test enforces, reused existing club ids,
  sorted the clubs map for a clean diff, and warned on collisions. Zero
  integrity-test failures on first run — the script guaranteed what the test
  checks.
- **Player-id override map** made the one real collision (two Ronaldos) explicit
  and safe: Cristiano keeps the locked `ronaldo`, the Brazilian got
  `ronaldo-nazario`.
- **Adversarial audit caught a weak reviewer.** The first half-1 audit returned
  "no errors" with 0 tool calls (answered from memory). Re-running with a hard
  "you MUST use WebSearch, no-tool-calls is a failure" instruction produced a
  real 15-tool-call verification. Lesson: check the tool-use count, not just the
  verdict.

## What was tricky / bugs

- **Near-duplicate club slugs are the main hazard.** Agents returned "Monaco",
  "Groningen", "Hamburg", "Wolfsburg" where the dataset already had "AS Monaco",
  "FC Groningen", "Hamburger SV", "VfL Wolfsburg". Left alone these would create
  a second club id for the same real team. Fixed by canonicalizing names before
  merge. The automated integrity test does NOT catch this (both ids are valid
  slugs) — it needs a human/name-canonicalization pass.
- **Fresh sprout worktree had no `node_modules`.** `npm run ci` first failed with
  "prettier: command not found"; needed `npm install` in the worktree first.

## Lessons for wave 2 (and future data work)

1. **Reuse `merge.js` + the id-override + canonicalization approach.** Before
   merging, diff incoming club names against the existing clubs map and add any
   aliases (short name -> canonical existing name) so no duplicate club id is
   created. Keep a running canonicalization list.
2. **Force tool use in audit agents** ("no tool calls = failure") and verify the
   reported tool-use count.
3. **`npm install` in the worktree before `npm run ci`.**
4. **Single-club legends are fine** (Totti/Maldini/Puyol) — do not pad their
   careers to make longer puzzles; accuracy wins.
5. **Cross-check new candidates against the already-present players** (now 84)
   to avoid duplicate people, not just duplicate clubs.
