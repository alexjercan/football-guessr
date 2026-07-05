# Review — Expand player pool wave 2 (`20260705-172916`)

**Verdict: APPROVE**

## Scope reviewed

Branch `add-players`, commit `9272986`. Data-only: +50 players (84 -> 134) and
+55 clubs (140 -> 195) in `src/data/data.json`, plus the task file. No app code.

## Checks performed

1. **Automated gate** — `npm run ci` green: prettier, eslint, 140 Jest tests
   pass, including `test/data.test.ts` (club id == slugify(name); referential
   integrity across all 195 clubs; legacy four locked).
2. **Production build** — `npm run build` compiles; `data.json` bundles (51.6
   KiB).
3. **Structural scans** — no near-duplicate club slugs (clustering by normalized
   token) and no orphan (unreferenced) clubs. No player-id collision with the
   existing 84.
4. **Duplicate-person check** — all 50 wave-2 names were chosen against the
   post-wave-1 roster; none re-add an existing player.
5. **Accuracy audit (adversarial, web-verified)** — both halves audited by
   independent agents that actually searched (19 and 12 tool calls; the retro's
   "no tool calls = failure" rule held). Zero significant findings; return spells
   (Cruyff/Ajax, Beckenbauer/Cosmos, Gullit's Milan-Sampdoria loops, Crespo's
   chain, Falcao's Monaco return, Di María/Benfica, Dani Alves/Barcelona) and
   recent moves (Rashford -> Villa -> Barcelona, Wirtz -> Liverpool, Kvara ->
   PSG) all verified correct and in order.

## Non-blocking observations

- Long journeyman careers (Alexis Sánchez 12 clubs, Rivaldo 11, Hernán Crespo
  10) are kept in full for accuracy; the recognizable clubs appear mid-sequence,
  so guessability is fine. Consistent with wave 1's decision to favor accuracy
  over trimming.
- Single-club entries (Giggs, Scholes -> Manchester United; Musiala -> Bayern)
  are accurate one-club careers, same rationale as wave 1.

## Conclusion

Meets the task's definition of done and completes the overall goal: **134
players** total (from 32), every new career web-verified, CI green, build OK,
no structural issues. Approved.
