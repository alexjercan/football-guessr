# Review — Expand player pool wave 1 (`20260705-172932`)

**Verdict: APPROVE**

## Scope reviewed

Branch `add-players`, commit `820b412`. Change is data-only: +52 players
(32 -> 84) and +78 clubs (62 -> 140) in `src/data/data.json`, plus the two task
files. No app code touched.

## Checks performed

1. **Automated gate** — `npm run ci` green: prettier, eslint, and 140 Jest tests
   pass. This includes `test/data.test.ts`, which enforces the three hard
   invariants:
   - club id == slugify(display name) for every one of the 140 clubs;
   - referential integrity (every club id a player references exists);
   - the legacy four (`neymar/messi/ronaldo/mbappe`) keep their ids and exact
     resolved club sequences.
2. **Production build** — `npm run build` compiles successfully; `data.json`
   bundles as a 33.5 KiB asset.
3. **Collision safety** — the Brazilian Ronaldo is keyed `ronaldo-nazario`, so
   Cristiano's locked `ronaldo` id is untouched (spot-checked: still
   "Cristiano Ronaldo"). No new player id collides with an existing one.
4. **Near-duplicate club scan** — clustering club ids by normalized token found
   no two ids pointing at the same real club. Agent-provided names were
   canonicalized before merge to reuse existing ids: Monaco -> AS Monaco,
   Groningen -> FC Groningen, Hamburg -> Hamburger SV, Wolfsburg -> VfL
   Wolfsburg. Shared clubs (New York Cosmos, Vissel Kobe, New York City FC,
   Heerenveen, Anzhi Makhachkala) resolve to a single id each.
5. **Accuracy audit (adversarial, web-verified)** — all 52 new careers were
   re-checked by two independent audit agents against Wikipedia/transfermarkt
   (one half re-run with forced tool use after a first pass answered from
   memory). Both returned **zero** significant findings: no phantom clubs, no
   missing major clubs, no out-of-order sequences.

## Notes / non-blocking observations

- A few legends are intentionally single-club (Totti -> Roma, Maldini -> AC
  Milan, Puyol -> Barcelona) and two current players are single-club (Saka,
  Foden). These are accurate one-club careers; as puzzles they reveal only one
  club, which is acceptable and on-theme (loyal one-club men). No change needed.
- Some careers include obscure trailing clubs (e.g. Eto'o's Qatar SC, Roberto
  Carlos's Delhi Dynamos). These are factually correct and appear late in the
  sequence, so they do not hurt guessability. Kept for accuracy.
- Wave 2 (`20260705-172916`) will push toward ~130; it should reuse the same
  merge tooling and canonicalization map.

## Conclusion

Meets the task's definition of done: ~80 players (84), every new career
web-verified, CI green including integrity + legacy-lock tests, game builds and
resolves. Approved.
