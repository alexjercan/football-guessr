# Football Club Guesser - V2 Task Breakdown: Quality of Life & UX

- STATUS: CLOSED
- PRIORITY: 100
- TAGS: planning,docs,qol

## Context

V1 is playable end-to-end (Daily + Practice modes, shared `createGame()` core
in `src/game.ts`, DOM wiring in `src/ui/mountGame.ts`). This document tracks
V2: quality-of-life and UX features that don't touch core game rules.

The snippets below are lifted from a different project (a species-guessing
game) and are **references, not drop-in code** — data shapes differ
(`Species`/`Clade` vs `PlayerEntry`/club strings), so each task calls out what
needs adapting.

Suggested build order: Step 7 → 8 → 9 → 10 → 11 → 12 (7 and 8 are independent
and can be done in parallel; 9 must land before 10; 11 and 12 are optional
polish).

---

## V2 Step 7 — Autocomplete for Guess Input

- STATUS: OPEN
- PRIORITY: 90
- TAGS: ux,input

**Goal:** Replace the bare text input with a type-ahead dropdown so players
pick from real player names instead of hoping their spelling matches, and so
they can't accidentally re-guess someone already guessed.

**Reference:** `autocomplete.ts` (species-name autocomplete) — pattern
transfers almost directly:
- `speciesNames: string[]` → `playerNames: string[]` (derive once from the
  loaded dataset, e.g. `players.map(p => p.name)`)
- `isGuessed(name)` → check against `view.pastGuesses` from `GameView`
  (Step 4's `toView()` already exposes this)
- Keep the debounce-free `input`/`focus`/`blur` + arrow-key/Enter navigation
  as-is; it's UI-only and framework-agnostic

**Checklist:**
- [ ] Add `#autocomplete-box` (a `div`) next to `#guess-input` in
      `src/index.html`, positioned via CSS (`position: absolute`)
- [ ] New `src/ui/autocomplete.ts`: adapt the snippet's `setupAutocomplete()`
      signature to `{ inputEl, autocompleteBox, playerNames, isGuessed, onSelect }`
- [ ] Wire into `mountGame.ts`: `onSelect` should populate the input and
      **auto-submit** (matches the snippet's `selectAndSubmit` behavior) —
      confirm this is the desired UX vs. select-then-manual-submit
- [ ] Case-insensitive substring match is enough for V2 (no fuzzy matching —
      stays out of scope per V1 README)
- [ ] Filter out already-guessed names from suggestions (avoids wasting a
      guess re-submitting the same wrong name)
- [ ] Mobile check: dropdown should not get clipped by the viewport edge
- [ ] Tests: a small `test/autocomplete.test.ts` for `findMatches`-equivalent
      logic (pure filtering function extracted so it's testable outside the DOM)

**Note:** extract the pure filter/match function (name list + query →
matches) out of the DOM-wiring function, same split as Step 4's
reducer/facade — keeps it unit-testable and keeps `src/ui/**` (DOM) excluded
from coverage while the pure logic isn't.

---

## V2 Step 8 — Win / Loss Modal (with confetti)

- STATUS: OPEN
- PRIORITY: 85
- TAGS: ux,polish

**Goal:** Replace the plain `#status` text with a proper end-of-game modal —
clearer win/loss moment, room for stats and a share button later (Step 12).

**Reference:** `modal.ts` — reusable close to as-is:
- Needs `canvas-confetti` as a new dependency (`npm install canvas-confetti
  @types/canvas-confetti`)
- `speciesName` → target player's `name`; `MAX_GUESSES` already exists as a
  constant in `src/game.ts` (Step 4) — import it, don't redefine
- `guessCount` → `view.guessesUsed`
- Drop the `shareIcon`/share-button wiring for now (Step 12 owns that) unless
  you want to stub the button hidden

**Checklist:**
- [ ] Add modal markup to `src/index.html`: `#modal-overlay`, `#modal`,
      `#modal-icon`, `#modal-title`, `#modal-message`, `#modal-stats`,
      `#modal-close-btn` (hidden by default, shown via `.active` class)
- [ ] New `src/ui/modal.ts` with `showWinModal(playerName, guessCount)` /
      `showLossModal(playerName)`, adapted from the snippet
- [ ] In `mountGame.ts`'s `render(view)`: on `status === "won"` call
      `showWinModal`, on `status === "lost"` call `showLossModal`, instead of
      (or in addition to) the current `#status` text update
- [ ] Confetti only on win, never on loss
- [ ] Modal close button + backdrop-click-to-close; on Daily mode there's no
      "Play Again" so closing just leaves the modal dismissed with the board
      visible underneath
- [ ] Verify modal doesn't trap focus in a way that breaks the
      `#play-again` button flow already wired in Step 5

---

## V2 Step 9 — LocalStorage Persistence + Daily Puzzle Numbering

- STATUS: OPEN
- PRIORITY: 80
- TAGS: persistence,daily

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

---

## V2 Step 10 — Profile / Stats Page

- STATUS: OPEN
- PRIORITY: 75
- TAGS: ux,stats,new-page

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

---

## V2 Step 11 — Guess/Hint Info Panel

- STATUS: OPEN
- PRIORITY: 70
- TAGS: ux,polish

**Goal:** A side panel that gives the current guess more visual weight than
a plain list item — club crest (if/when art assets exist) or at minimum a
cleaner card-style display of revealed clubs and past guesses, openable/
closable without losing game state.

**Reference:** `panel.ts` — the open/close/manually-closed state machine
(`openPanel` / `closePanel` / `closePanelManually` / `isPanelOpen`) is
generic and portable as-is. The *content* logic (`renderLastGuess`,
clade-tree "best hint" lookup) is specific to the source game's
species/clade tree and does **not** transfer — we have no clade-equivalent
hierarchy, just a flat chronological club list.

**Adapted approach for this game:**
- [ ] `src/ui/panel.ts`: copy the open/close state machine verbatim
- [ ] Replace `renderLastGuess` with something simpler: on each render,
      show a card for the most-recently-revealed club (name only, unless/
      until crest images are added) and/or a scrollable list of past wrong
      guesses (`view.pastGuesses`)
- [ ] Decide: auto-open on first hint (like the reference) or start closed
      and let the player opt in? Given this game has far fewer
      hints/screen real estate pressure than the source game, consider
      defaulting **open** and skip `manuallyClosedPanel` tracking entirely
      for V2 — simpler, revisit if it feels cluttered
- [ ] `createSpeciesCard`/`createCladeCard`/`mountCard` from `ui/card.ts` in
      the reference don't exist in this project — write a minimal
      `createClubCard(name)` / `createGuessCard(name)` instead, or skip
      cards entirely and just style list items for V2

**This is the lowest-confidence task in this doc** — worth a quick spike to
see if it earns its complexity before fully committing, since the
"clone the code" leverage that the other tasks get from their snippets is
much weaker here.

---

## V2 Step 12 — Share Result (optional, stretch)

- STATUS: OPEN
- PRIORITY: 60
- TAGS: ux,stretch

**Goal:** Wordle-style "share your result" button on the win/loss modal —
copies an emoji/text summary to clipboard, no answer spoilers.

**Reference:** `modal.ts`'s unused `modalShareBtn`/`shareIcon` wiring is the
seed for this; nothing else in the provided snippets covers the actual share
logic (needs to be written fresh).

**Checklist:**
- [ ] Format: something like `⚽ Football Club Guesser — Daily #14 — 4/25
      guesses 🟩🟩🟥🟥` (green squares = clubs revealed before the win, red =
      wasted guesses — pick whatever mapping feels honest to how the game
      plays)
- [ ] `navigator.clipboard.writeText(...)` with a fallback message if
      unavailable (older browsers / non-HTTPS contexts)
- [ ] Only show the share button once the game has ended (reuse
      `showWinModal`/`showLossModal` from Step 8)
- [ ] No copyrighted crest emoji or club logos in the share text — plain
      unicode squares only

**Depends on:** Step 8 (modal) for the button's home; benefits from Step 9
(daily numbering) for the "Daily #N" line but can ship without it.

---

## Out of scope for V2 (parking lot)

- Fuzzy/typo-tolerant name matching (still explicitly deferred from V1)
- Club crest images / any binary art assets
- Multiplayer or leaderboards
- Difficulty levels / alternate datasets
