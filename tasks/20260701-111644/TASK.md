# V2 Step 9 — LocalStorage Persistence + Daily Puzzle Numbering

- STATUS: OPEN
- PRIORITY: 80
- TAGS: persistence,daily

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 9.

**Goal:** Two things bundled because they share the same storage layer:
1. Refreshing the page mid-Daily-game resumes exactly where you left off
   instead of re-rolling (Daily uses a deterministic seed already, but game
   *state* — guesses made, clubs revealed — currently lives only in memory).
2. Daily mode displays a puzzle number, e.g. "Daily #14", so it feels like a
   Wordle-style series rather than an anonymous random pick.

**Reference:** `storage.ts` — take the `StorageProvider` interface and
`BrowserStorage` implementation essentially verbatim; it's already
SSR-safe (`typeof localStorage === "undefined"` guards) and trivially
mockable for tests via the interface.

**Checklist:**

_Storage layer_
- [ ] `src/storage.ts`: copy `StorageProvider` / `BrowserStorage` /
      `defaultStorage()` from the reference, unchanged
- [ ] Decide key scheme, e.g. `fcg:daily:<YYYY-MM-DD>` for in-progress daily
      state, `fcg:stats:daily` / `fcg:stats:practice` for aggregate stats
      (used in Step 10)

_Daily numbering_
- [ ] Pick a launch date constant (`DAILY_EPOCH = new Date("2026-07-01")` or
      similar) in `src/helpers.ts` next to `dateToSeed`
- [ ] `dailyPuzzleNumber(date: Date): number` — whole days since epoch + 1
- [ ] Surface it in the `#mode` label mountGame.ts already sets: `"Daily
      #14"` instead of just `"Daily"`
- [ ] Test: `dailyPuzzleNumber` for a few known date offsets

_Resume in-progress Daily game_
- [ ] On `mountGame({ mode: "daily" })`, before calling `createGame`, check
      `storage.getItem("fcg:daily:<today>")` for a saved `{ guesses:
      string[] }` (or similar minimal shape — **don't** persist the answer
      itself in plaintext if you want to discourage devtools-peeking, though
      this is optional hardening, not a hard requirement)
- [ ] If found, replay the saved guesses through `submitGuess` on a freshly
      created game (reuses Step 4's pure reducer — no need for a special
      "restore" code path) to reconstruct state instead of duplicating
      reducer logic in storage
- [ ] After every `submitGuess` call in `mountGame.ts`, persist the updated
      guess list for `mode === "daily"` only (Practice intentionally doesn't
      persist — it's meant to be replayable)
- [ ] Clear/ignore stale saved state from a previous day (key is
      date-scoped, so this should fall out naturally — just confirm)
- [ ] Manual test: play a Daily game halfway, refresh, confirm hints +
      guesses-used + input state match; finish the game, refresh again,
      confirm it shows the completed/won-lost state and doesn't let you
      replay

**Depended on by:** Step 10 (Profile / Stats Page) needs this storage layer +
a stats-recording write path. Step 12 benefits from the daily numbering.
