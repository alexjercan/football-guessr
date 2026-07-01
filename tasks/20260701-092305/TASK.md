# V1 Step 5 — HTML Page to Play the Game (Daily + Practice)

- STATUS: CLOSED
- PRIORITY: 40
- TAGS: ui,html

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 5.

**Goal:** A minimal, playable UI wired to the existing Step 4 logic. A random
footballer is chosen and the user guesses via the DOM. The _same_ UI powers two
entry points that differ only in how the target is seeded:

- `index.ts` (Daily) — seed from the current date, so everyone gets the same
  player that day (Wordle-style). One puzzle per day: no "Play Again".
- `practice.ts` (Practice) — random seed, fresh player each load, with "Play Again".

**Already done — do NOT rebuild (Step 4 is CLOSED):**

- `src/game.ts` `createGame(players, { rng })` → `{ submitGuess, getView, restart }`.
  `GameView` gives `revealedClubs`, `guessesRemaining`, `status`, `answer`, …
  `rng: () => number` is the seam for Daily vs Practice.
- `src/dataLoader.ts` `loadGameData()` → `{ players }` (async).
- `webpack.config.js` already builds `index` + `practice`; BOTH render from the
  same `src/index.html` template, so game markup is written once. Header/footer
  are injected into `#header`/`#footer` by the HtmlPartials plugin.
- `src/ui/**` is already excluded from Jest coverage — put DOM wiring there.

**Design (keep it simple):**

1. Game markup lives once in `src/index.html` `<main>` (shared by both pages).
2. One shared bootstrap `src/ui/mountGame.ts` does all DOM work: load data →
   `createGame(players, { rng })` → render → wire submit + "Play Again".
3. Two pure helpers in `src/helpers.ts`: `mulberry32(seed)` and `dateToSeed(date)`.
4. `index.ts` / `practice.ts` become ~4 symmetric lines — only the seed + mode differ.

**Checklist:**

_Markup — `src/index.html` `<main>`_

- [x] `#mode` label, `#clubs` list (revealed clubs), `#guess-form` with
      `#guess-input` + submit button, `Guesses left: #guesses-left`, `#status`
      (`role="status" aria-live="polite"`), and a hidden `#play-again` button.

_Seed helpers — `src/helpers.ts`_

- [x] `mulberry32(seed: number): () => number` — deterministic value in [0,1).
- [x] `dateToSeed(date: Date): number` — UTC-based, so the daily is identical worldwide.

_Bootstrap — `src/ui/mountGame.ts`_

- [x] `mountGame({ rng, mode }: { rng: () => number; mode: "daily" | "practice" }): Promise<void>`
- [x] `render(view)`: list `revealedClubs`; set guesses-left; win → "Correct! It
      was {answer}."; loss → "Game Over — it was {answer}."; on game over disable
      input; show `#play-again` ONLY when `mode === "practice"`; set `#mode` text.
- [x] Wire `submit` (call `submitGuess`, clear + refocus input) and `play-again`
      (call `restart`, refocus). Render once on load via `getView()`.

_Entry points (symmetric)_

- [x] `index.ts`: `mountGame({ rng: mulberry32(dateToSeed(new Date())), mode: "daily" })`
- [x] `practice.ts`: `mountGame({ rng: mulberry32(<random/time seed>), mode: "practice" })`

_Styling (minimal)_

- [x] Small themed block in `src/style.css` reusing existing CSS variables
      (glass/amber). No new framework; ~15 lines is plenty. `main { flex: 1 }` so
      it fills between header/footer.

_Tests & checks_

- [x] `test/helpers.test.ts`: `mulberry32` deterministic (same seed → same
      sequence; different seeds differ) and `dateToSeed` stable for a fixed date.
- [x] Keep `npm run ci` green: if entry scripts drop coverage, add `!src/practice.ts`
      to `collectCoverageFrom` (mirroring the existing `!src/index.ts`).
- [x] Manual playtest (`npm run serve`): play `/` and `/practice` to a win and a
      loss; confirm `/` shows the same player on reload with no "Play Again", and
      `/practice` reshuffles and offers "Play Again".

**Out of scope for Step 5:** Daily/Practice nav link, autocomplete, fuzzy
matching, crests, persistence/streaks, larger dataset (see Step 6 / README).

---

**Implementation notes:**

- Markup added to `src/index.html` `<main>` (shared by Daily + Practice via
  webpack); `faq.html`/`profile.html` are separate templates and untouched.
- `src/helpers.ts` gained `mulberry32` + `dateToSeed` (UTC `YYYYMMDD`).
- All DOM wiring is in `src/ui/mountGame.ts` (already excluded from coverage);
  `index.ts`/`practice.ts` are now thin symmetric entry points.
- `test/helpers.test.ts` adds 10 tests; `npm run ci` green (41 tests, 100% on
  covered files). `!src/practice.ts` added to `collectCoverageFrom` mirroring
  `!src/index.ts`.
- No headless browser in this environment, so the interactive playtest was
  substituted with: (a) `npm run build` confirming both `/` and `/practice`
  emit the shared game markup with their own bundle, and (b) a ts-node
  simulation over the real `players.json` proving the Daily seed picks the same
  player across reloads (2026-07-01 → Cristiano Ronaldo), Practice varies across
  loads, and win/loss/restart transitions behave. A final human click-through is
  still recommended.
