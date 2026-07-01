# V2 Step 10 — Profile / Stats Page

- STATUS: OPEN
- PRIORITY: 75
- TAGS: ux,stats,new-page

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 10.

**Goal:** A third page (`profile.html` / `profile.ts`, mirroring the
Daily/Practice split already in `webpack.config.js`) showing games played,
win rate, streaks, average guesses, and a guess-distribution chart per mode.

**Blocked on:** Step 9 (needs the storage layer + a stats-recording write
path — every completed game must record itself, not just the resume-state
blob).

**Reference:** `profile.ts` (the `main()` / `updateStatsUI` /
`renderGuessDistribution` functions) — this is from a much more built-out
profile page (includes a rolling-average SVG graph and a species
collection carousel) that's more than V2 needs. Treat it as a **menu to pick
from**, not a checklist to fully replicate:

**In scope for V2:**
- [ ] `src/gameStats.ts`: a `computeGameStats(storage, mode):
      GameStats` reading whatever Step 9 records, returning at minimum
      `{ gamesPlayed, wins, losses, currentStreak, longestStreak,
      averageGuesses, guessDistribution: Map<number, number> }`
- [ ] `src/profile.html` + `src/profile.ts`: new webpack entry (add to
      `webpack.config.js` alongside index/practice/faq), tabs for
      Daily/Practice stats (`setupTabs()` pattern from the reference is
      small and reusable as-is)
- [ ] `renderGuessDistribution()` (bar chart of "won in N guesses") —
      reference implementation is plain DOM/innerHTML, no library needed,
      portable almost unchanged
- [ ] Nav link to Profile from Daily/Practice pages (this was explicitly
      out-of-scope in V1 Step 5 — now's the time)

**Explicitly out of scope for V2** (this is what makes the reference
"more than needed" — revisit only if there's appetite later):
- Rolling-average line graph (`renderRollingAverage` + SVG scaling/tooltip
  code) — neat, but a lot of surface area for a guesser game with far fewer
  data points than a daily-species game
- "Collection carousel" of previously-guessed entities (`renderGuessedDinosaurs`
  + `createLockedSpeciesCard`) — would require player portraits/crests we
  don't have assets for yet; the guess-history panel in Step 11 partially
  covers this need more cheaply

**Note on write path:** stats must be recorded exactly once per finished
game. The natural hook is inside `mountGame.ts`'s `render(view)`, on the
transition into `"won"`/`"lost"` — guard against double-recording on
re-render (e.g. a `recorded` flag in the mount closure, or check-before-write
against a `lastRecordedGameId`).
