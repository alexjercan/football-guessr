# V2 Step 9 — LocalStorage Persistence + Daily Puzzle Numbering

- STATUS: CLOSED
- PRIORITY: 80
- TAGS: persistence,daily

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 9.

**Revision note (post-close):** the storage model was reworked from a single
per-mode stats-log array + a separate Daily-state key into **one record per
game**, keyed `fcg:game:v2:<mode>:<seed>` with the minimal shape
`{ mode, seed, playerId, guesses }`. The "all games" list and every derived
stat are computed at runtime (`loadAllGames` + replay), and Practice now uses a
`Date.now()` timestamp as its seed (as Daily uses the date) and only persists on
finish. See the Decisions/Checklist below for the current design.

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

**Decisions (from the requester):**
- **One record per game, stored individually** — NOT a single array/list blob.
  Each game is its own key/value entry with the minimal shape
  `{ mode, seed, playerId, guesses }`. The full "all games" list is rebuilt at
  runtime by enumerating keys (`loadAllGames(mode)`), so writes stay cheap and
  independent and each game is inspectable/removable on its own.
- **Everything else is derived, not stored.** Win/loss, guesses used, and the
  guess distribution are recomputed by replaying `guesses` against the target
  player's clubs — the stats page already loads the dataset — so there's no
  separate results log that can drift out of sync.
- **Persist full state incl. the answer** (as `playerId`) so the game can be
  rebuilt on load: force that player, then replay the saved guesses through the
  reducer.
- **Unique key per game:** `fcg:game:v2:<mode>:<seed>`.
  - Daily seed = a distinct integer per UTC calendar day, so each day owns
    exactly one slot (in-progress saves overwrite in place; yesterday's game is
    a different key, never resumed — stale seeds are ignored).
  - Practice seed = the epoch-ms timestamp the play started at (mirrors how
    Daily uses the date as its seed): every play is its own slot and the seed
    doubles as a "played at" clock for ordering.
- **Persist timing differs by mode:**
  - Daily saves after every guess (mid-game refresh resumes) and on mount.
  - Practice writes **nothing** while in progress and saves a single record
    only once the game is won/lost — no half-finished practice clutter. Each
    "Play Again" re-rolls a fresh timestamp seed so it becomes a new record
    rather than overwriting the previous one.
- **Daily "Go to Practice":** a "Play Practice Mode" button in the end-of-game
  modal (Daily only), since Daily has no in-page "Play Again".
- **Reopening a finished Daily** replays the win/loss animation (modal +
  confetti) and shows the practice button. Because the record is derived (not
  a counted append), reopening is inherently idempotent — nothing to re-count.

**Checklist:**

_Storage layer_
- [x] `src/storage.ts`: `StorageProvider` / `BrowserStorage` /
      `defaultStorage()` (+ `MemoryStorage` for tests). SSR-safe and swallows
      private-mode/quota exceptions. Extended with `keys()` (enumerate all
      stored keys) so the game list can be rebuilt from individual entries.
- [x] `src/gameStorage.ts`: individual-record model.
      - `gameKey(mode, seed)` -> `fcg:game:v2:<mode>:<seed>`; `parseGameKey`
        turns a key back into `{ mode, seed }` (rejects foreign/malformed keys).
      - `SavedGame = { mode, seed, playerId, guesses }`; `saveGame` /
        `loadGame(mode, seed)` for a single game (load rejects payloads whose
        embedded mode/seed disagree with the key).
      - `loadAllGames(mode)` enumerates matching keys via `storage.keys()`,
        skips foreign/corrupt entries, and returns games sorted by seed
        (chronological). This is what Step 10 reads.
      - No results-log blob and no `recordGame`: outcomes are derived by replay.
      - Namespaced (`fcg:`) + versioned (`v2`) so a schema bump won't collide.

_Daily numbering_
- [x] `DAILY_EPOCH = new Date("2026-07-01T00:00:00Z")` in `src/helpers.ts`.
- [x] `dailyPuzzleNumber(date)` — whole UTC days since epoch + 1 (epoch day is
      #1; pre-epoch dates clamp to 1).
- [x] Surfaced in the `#mode` label: `"Daily #14"` (falls back to `"Daily"` if
      no number is supplied).
- [x] Tests: `dailyPuzzleNumber` for epoch day, later offsets, intra-day
      stability, and pre-epoch clamping.

_Resume in-progress Daily game_
- [x] `mountGame({ mode: "daily", seed, ... })` loads
      `fcg:game:v2:daily:<seed>` before creating the game.
- [x] Reconstructs by forcing the saved player and replaying the saved guesses
      through `submitGuess` (reuses the pure reducer — no bespoke restore path).
- [x] Persists the updated game after every `submitGuess`, Daily only (Practice
      never persists in-progress state — it's replayable). The save reads
      guesses straight from the returned `GameView` so it can't lag a render.
- [x] Stale prior-day state falls out naturally (date-scoped key + the loader
      rejects a payload whose embedded mode/seed ≠ the requested key).
- [x] Verified end-to-end (throwaway jsdom-free harness driving the real
      `mountGame`): mid-game refresh restores hints + guesses-used; finishing
      then reloading shows the completed state, replays the modal, and does not
      let you re-guess (idempotent — derived stats can't be double-counted).

_Practice persistence (revised model)_
- [x] Practice seeds from `Date.now()` (timestamp-as-seed), passed as both the
      RNG seed and the save key. Writes nothing while playing; saves exactly one
      `fcg:game:v2:practice:<seed>` record on win/loss.
- [x] "Play Again" re-rolls a fresh timestamp seed, so each finished play is a
      distinct record instead of overwriting the previous game's slot.

**Also delivered (beyond the original checklist, per request):**
- [x] `loadAllGames(mode)` — the runtime aggregator Step 10 reads to compute
      totals/streaks/distribution (by replaying each record's guesses). Replaces
      the earlier append-only stats-log blob + `recordGame`.
- [x] "Play Practice Mode" button on the Daily end-of-game modal.

**Depended on by:** Step 10 (Profile / Stats Page) reads this storage layer via
`loadAllGames(mode)` and derives stats by replaying each saved game's guesses
against its player (no stored results log). Step 12 benefits from the daily
numbering.
