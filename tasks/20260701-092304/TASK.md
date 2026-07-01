# V1 Step 4 — Core Game Loop Logic (TypeScript)

- STATUS: CLOSED
- PRIORITY: 45
- TAGS: game-logic,core

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 4.

**Goal:** All game rules implemented as framework-agnostic TypeScript, independent of the DOM, so it's testable and reusable.

**Checklist:**
- [x] Define `GameState` type: target player, revealed clubs, guesses used, max guesses (25), status (`playing`/`won`/`lost`)
- [x] `startGame()`: pick a random player, reveal only the first club, 0 guesses used
- [x] `submitGuess(name: string)`: increment guesses; correct (case-insensitive, trimmed) → `won`; else if guesses >= 25 → `lost`; else reveal next club if any; else keep accepting guesses with no new hint
- [x] Handle edge case: club list shorter than 25 (don't crash when clubs run out early)
- [x] Expose a clean state getter for the UI (hints shown, guesses remaining, status, target name only after game end)
- [x] Write basic manual/automated test cases (correct guess, wrong guesses cycling clubs, exhausting guesses, exhausting clubs before guesses)

**Current status (CLOSED):** Done. Implemented the pure reducer (`createInitialState` / `applyGuess` / `toView`) plus the stateful `createGame()` facade (`submitGuess` / `getView` / `restart`) in `src/game.ts`, added `GameStatus` / `GameState` / `GameView` to `src/types.ts`, and added accent-insensitive matching in `src/matching.ts`. `chooseRandomPlayer` is consolidated in `src/helpers.ts` (duplicate removed from `game.ts`); `src/dataLoader.ts` already read `players.json` as a bare array. Tests in `test/matching.test.ts` and `test/game.test.ts` (31 cases) pass; `npm run ci` is green (format, lint, 100% coverage on game/helpers/matching).

---

## Implementation plan (agreed)

Framework-agnostic core with a **pure reducer** wrapped by a thin **stateful `createGame()` facade**. Flat file layout under `src/` (matching the existing structure — no `src/game/` subdir).

### Design decisions
- **API:** export pure `createInitialState()` / `applyGuess()` / `toView()` for direct testing; wrap them in `createGame(players, opts)` returning `submitGuess(name)` / `getView()` / `restart()` for the UI.
- **Randomness:** facade takes `rng?: () => number` (default `Math.random`) plus optional `forcePlayer` for tests, and reuses the existing `helpers.chooseRandomPlayer(rng(), players)`. No new picker code.
- **Matching:** accent-insensitive — `normalizeName` does trim → lowercase → collapse whitespace → strip diacritics (`.normalize("NFD").replace(/\p{Diacritic}/gu, "")`), so "Mbappe" matches "Mbappé". Compares normalized full names.
- **Guess counting:** empty/whitespace-only submissions are ignored (no count, no reveal); duplicate guesses count normally.

### Files to create / change
- [ ] `src/types.ts` — ADD `GameStatus` (`"playing" | "won" | "lost"`), `GameState` (player, revealedCount, guesses[], maxGuesses, status), `GameView` (revealedClubs, guessesUsed, guessesRemaining, maxGuesses, status, outOfHints, pastGuesses, answer|null).
- [ ] `src/matching.ts` — NEW: `normalizeName()`, `namesMatch(guess, actual)`.
- [ ] `src/game.ts` — REWRITE: `MAX_GUESSES = 25`; pure reducer + `createGame()` facade; import `chooseRandomPlayer` from `./helpers` and remove the duplicate copy.
- [x] `src/dataLoader.ts` — FIX: read `players.json` as a **bare array** (`RawPlayerEntry[]`, `raw.map(...)`, drop `RawGameData`); still returns the in-memory `GameData { players }` wrapper.
- [ ] `test/matching.test.ts`, `test/game.test.ts` — NEW (inline fixtures, not the real JSON).

### `applyGuess` order (matches the doc)
1. `status !== "playing"` → no-op. 2. empty guess → no-op. 3. record guess. 4. correct → `won`. 5. else `guessesUsed >= MAX_GUESSES` → `lost`. 6. else reveal next club if `revealedCount < clubs.length`. 7. else stay `playing` with no new hint. `toView` reveals `answer` only once status is terminal.

**Edge cases:** clubs shorter than 25; single-club players; correct-on-25th wins over lost; post-terminal no-ops; empty dataset throws a clear error (also guards the unguarded `chooseRandomPlayer`).

### Tests
- `matching.test.ts`: trim/case/whitespace, accent-insensitivity, positive/negative matches.
- `game.test.ts`: initial invariants + hidden answer; correct→won; wrong→reveal+increment; cycling all clubs then hint-less continuation; 25→lost; correct-on-25→won; empty ignored / duplicates counted; deterministic via `forcePlayer`+stub `rng`; `restart()` resets.

### Notes
- **Duplicate resolved:** `chooseRandomPlayer` currently exists in both `helpers.ts` and `game.ts`; consolidate to `helpers.ts`.
- **Coverage (not blocking):** `jest.config.js` collects coverage across `src/**` (except `src/ui/**`, `index.ts`). Under `npm run ci`, `dataLoader.ts` and the CSS-only `practice/faq/profile.ts` will lower coverage; consider adding `dataLoader.ts` to the coverage exclusions later. Plain `npm test` does not enforce thresholds.

### Verify
`npm test` → `npm run lint` → tick the checklist boxes above.

