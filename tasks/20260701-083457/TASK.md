# Football Club Guesser - V1 Task Breakdown

- STATUS: CLOSED
- PRIORITY: 100
- TAGS: planning,docs

## Concept recap
- Player is shown a club as a hint.
- Player guesses a footballer's name.
- Wrong guess → reveal the next club the target player played for (in chronological order).
- Correct guess → win.
- Max 25 total guesses. Once clubs run out, no new hints are revealed, but guesses can continue until the limit.
- Hitting 25 guesses without the correct answer → Game Over.

## Tech stack
- TypeScript for game logic
- Webpack for bundling
- Plain HTML (no CSS/styling in V1)

---

## Task 0 — Project Documentation & Task Planning
**Goal:** Set the foundation for how the project will be tracked and understood before writing code.

- [ ] Write a short `README.md`: project pitch, rules of the game, tech stack, how to run it locally
- [x] Write this task list (`TASKS.md`) into the repo — done via this document - we will use `tatr` to track tasks
- [x] Decide on a simple task-tracking convention (e.g. checkboxes in `TASKS.md`, or GitHub Issues if you want) - we will use `tatr` to track tasks
- [ ] Define "V1 done" criteria explicitly (see Definition of Done below) so scope doesn't creep

**Definition of Done for V1:**
A single HTML page where a user can see a club hint, type a player name guess, submit it, and either win (correct guess) or get the next club hint (wrong guess) or lose (25 guesses exhausted), with no styling required.

---

## Task 1 — Initialize Repository
**Goal:** Basic project scaffolding, ready for TypeScript + Webpack development.

- [x] `git init` (or clone empty GitHub repo)
- [x] `npm init -y`
- [x] Add `.gitignore` (node_modules, dist, etc.)
- [x] Install TypeScript as a dev dependency
- [x] Add a basic `tsconfig.json` (target ES2020+, strict mode on, module resolution for bundling)
- [x] Set up folder structure, e.g.:
  ```
  /src
    /data      -> player dataset
    /game      -> core game logic
    index.ts   -> entry point
    index.html
  ```

---

## Task 2 — Webpack Build Configuration
**Goal:** Be able to build the TypeScript source + serve/bundle the HTML page.

- [x] Install webpack, webpack-cli, ts-loader (or babel-loader), and webpack-dev-server
- [x] Install `html-webpack-plugin` to inject the bundled JS into `index.html`
- [x] Create `webpack.config.js`:
  - entry: `src/index.ts`
  - output: bundled JS to `dist/`
  - module rule for `.ts` via ts-loader
  - HtmlWebpackPlugin pointing at `public/index.html` as template
- [x] Add npm scripts: `build` (production bundle) and `start`/`dev` (webpack-dev-server with live reload)
- [x] Verify a "Hello World" TypeScript file builds and renders in the browser before moving on

---

## Task 3 — Initial Player Dataset
**Goal:** A small but real dataset to power the game.

- [x] Decide on data shape, e.g.:
  ```ts
  interface PlayerEntry {
    id: string;
    name: string;
    clubs: string[]; // in chronological order, first club first
  }
  ```
- [x] Create `src/data/players.ts` (or `players.json`) with a hand-picked starter list (10–20 well-known players is plenty for V1 — e.g. Neymar, Messi, Ronaldo, Mbappé, etc.)
- [x] Keep club names as plain strings for V1 (no crest images, no IDs/normalization needed yet)
- [ ] Write a tiny helper to pick a random player from the dataset for a new game

**Note:** Don't over-invest here — a hardcoded array is fine for V1. A "real" data source (API/scraping) can be a later task.

---

## Task 4 — Core Game Loop Logic (TypeScript)
**Goal:** All game rules implemented as framework-agnostic TypeScript, independent of the DOM, so it's testable and reusable.

- [ ] Define `GameState` type: target player, revealed clubs so far, guesses used, max guesses (25), status (`playing` / `won` / `lost`)
- [ ] `startGame()`: picks a random player, initializes state with just the first club revealed, 0 guesses used
- [ ] `submitGuess(name: string)`:
  - increments guesses used
  - if guess matches target player name (case-insensitive, maybe trim whitespace) → status becomes `won`
  - else if guesses used >= 25 → status becomes `lost`
  - else if there's a next unrevealed club in the target's club list → reveal it
  - else (clubs exhausted but guesses remain) → no new hint, just continue accepting guesses
- [ ] Handle edge case: player's club list is shorter than 25 — don't crash when clubs run out early
- [ ] Expose a clean state object/getter so the UI layer can read: current hints shown, guesses remaining, status, (and target name only once game ends)
- [ ] Write a few basic manual test cases / a simple test script to sanity-check the logic (correct guess, wrong guesses cycling through clubs, exhausting guesses, exhausting clubs before guesses)

---

## Task 5 — HTML Page to Play the Game
**Goal:** Minimal, unstyled UI that lets a human actually play using the Task 4 logic.

- [ ] `src/index.html`: barebones structure — a place to show the current club hint(s), a text input for guesses, a submit button, a guesses-remaining counter, and a result/status message area
- [ ] `src/index.ts`: wires up DOM elements to the game logic
  - on submit: call `submitGuess`, re-render hint list / guesses left / status
  - on win: display success message with player name
  - on loss: display "Game Over" with the correct answer revealed
  - simple "Play Again" button/action to call `startGame()` and reset the DOM
- [ ] No CSS needed — default browser styling is fine for V1
- [ ] Manual playtest: run `npm start`, play a full game through to both a win and a loss

---

## Task 6 — Wrap-up & Sanity Check
**Goal:** Confirm V1 is genuinely playable end-to-end before calling it done.

- [ ] `npm run build` produces a working `dist/` that can be opened/served standalone
- [ ] Play through at least 3 full games (1 win, 1 loss by guesses, 1 loss/continue-without-hints scenario)
- [ ] Update `README.md` with final run instructions
- [ ] Note ideas explicitly *out of scope* for V1 (styling, larger dataset, fuzzy name matching, autocomplete, club crests, difficulty levels) so they don't creep in

---

## Suggested build order
Task 0 → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

Tasks 3 and 4 can be done in parallel/interleaved since the logic will want the data shape defined early, but keep the dataset trivial until the logic is proven.
