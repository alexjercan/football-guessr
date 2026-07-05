---
date: 2026-07-05
task: tasks/20260705-172916
title: Expand player pool — wave 2 (84 -> 134 players)
tags: [data, content, agents, research]
---

# Retro — Player pool expansion, wave 2

## What we did

Grew `src/data/data.json` from 84 to 134 players (+50) and 140 to 195 clubs
(+55), completing the two-wave goal of ~130 players. Same pipeline as wave 1:
5 parallel research agents (JSON contract) -> `merge.js` -> 2 adversarial
web-verify audit agents.

## Applied wave-1 lessons (and they worked)

- **Forced tool use in agents.** Every research/audit prompt said "returning
  data without tool calls is a failure." All 5 research agents searched (9-13
  calls each) and both audit agents searched (19 and 12 calls). No repeat of
  wave 1's from-memory audit.
- **Canonicalization up front.** Baked the exact existing club display names
  into each research prompt ("REUSE these EXACT forms: AS Monaco, VfL Wolfsburg,
  ..."). Result: the post-merge near-dup scan came back empty on the first try,
  vs wave 1 where I had to fix Monaco/Groningen/Hamburg/Wolfsburg after the fact.
- **Duplicate-person guard.** Passed the current 84-name roster into candidate
  selection; no person was re-added.
- **`merge.js` reused as-is.** The id-override + slugify approach handled 50 more
  players and 55 clubs with zero integrity failures.

## What was tricky

- **Very long journeyman careers** (Alexis Sánchez 12 clubs, Rivaldo, Crespo).
  Decided to keep them accurate and complete rather than trim, matching wave 1.
  The agents naturally trimmed the most obscure early/late clubs (e.g. Rivaldo's
  Bunyodkor/Kabuscorp), which is acceptable — the audit confirmed no MAJOR club
  was missing.
- **Current-player recency.** 2025 moves (Rashford -> Barcelona loan, Wirtz ->
  Liverpool, Kvaratskhelia -> PSG) needed explicit "verify latest club as of
  2024-2025" instructions; agents got them right.

## Lessons for future data work

1. The wave-1 pipeline is now proven and repeatable: **research agents (JSON +
   forced search + canonical club names) -> merge.js -> adversarial audit**.
   Reuse it wholesale for any future pool expansion (e.g. a wave 3, or themed
   packs).
2. **Front-load canonicalization** into the research prompt; it is far cheaper
   than fixing duplicate club slugs after merge.
3. The tooling lives in the job temp dir this run; if pool expansion becomes
   recurring, consider promoting `merge.js` into `scripts/` with a committed
   authoring format so it is not re-derived each time.
