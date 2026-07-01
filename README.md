# Football Guessr

Guess the mystery footballer from the clubs they've played for. You start with a
single club as a hint — every wrong guess reveals the next club in that player's
career, so the longer you take, the more career history you have to work with.

> **Status:** V1 complete and playable end-to-end. The game loop, the Daily and
> Practice pages, the build pipeline, and the starter dataset are all in place;
> `npm run build` produces a working standalone `dist/`. See
> [Project status](#project-status) below.

## How to play

- You're shown one of a mystery player's former clubs as your first hint.
- Type a guess for the player's name and pick from the autocomplete dropdown, or
  just press Enter and the closest matching real player is used.
- **Wrong guess** → the next club in that player's career (chronological order) is
  revealed as an extra hint.
- **Correct guess** → you win.
- You get up to **25 guesses** total.
- If the player's clubs run out before you hit 25 guesses, no new hints appear —
  but you can keep guessing until the limit.
- Reach 25 guesses without the right answer → **Game Over**, and the answer is
  revealed.

Guessing is case-, whitespace-, and accent-insensitive, so `Mbappe` matches
`Mbappé` and extra spaces don't count against you. The input also **fuzzy-matches
and autocompletes** against real players: partial or subsequence spellings like
`Messi` or `LMess` resolve to `Lionel Messi`, already-guessed players are hidden,
and input that matches no one (e.g. `Messss`) is ignored rather than wasting a
guess.

### Two ways to play

- **Daily** (home page, `/`) — a single mystery player chosen from today's date,
  so everyone gets the same puzzle, numbered like Wordle (e.g. "Daily #14"). One
  game per day; no replay. Your progress is saved locally, so refreshing or
  coming back later resumes exactly where you left off (and a finished puzzle
  stays finished, with a shortcut into Practice).
- **Practice** (`/practice`) — a fresh random player every time, with a
  **Play Again** button for endless rounds.

Results for both modes are recorded in your browser's local storage to power the
Profile stats page.

## Tech stack

- **TypeScript** — game logic and page scripts
- **Webpack 5** — bundling, multi-page HTML generation, and dev server
- **Tailwind CSS v4** (via PostCSS) — styling
- **Jest** (ts-jest) — unit tests for the framework-agnostic game logic
- **ESLint + Prettier** — linting and formatting
- **Nix flake** — optional reproducible dev shell

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) and npm

  Alternatively, if you use Nix with flakes enabled, drop into a dev shell with
  Node available:

  ```bash
  nix develop
  ```

### Install

```bash
npm install
```

### Run locally

Start the dev server with live reload:

```bash
npm run serve
```

Then open <http://localhost:8080>. The available routes are `/` (Daily),
`/practice`, `/faq`, and `/profile`.

### Build

Produce a static bundle in `dist/`:

```bash
npm run build
```

The game fetches its dataset (`data/players.json`) at runtime, so serve the built
`dist/` over HTTP with any static file server rather than opening `index.html`
directly via `file://`. For example:

```bash
npx serve dist
# or
python3 -m http.server --directory dist 8080
```

### Test, lint, and format

```bash
npm test            # run the Jest test suite
npm run test:coverage  # run tests with a coverage report
npm run lint        # ESLint
npm run format      # Prettier (writes changes)
npm run ci          # format check + lint + tests with coverage
```

## Project structure

```
src/
  data/players.json     # player dataset (id, name, chronological clubs[])
  types.ts              # shared types (PlayerEntry, GameState, GameView)
  game.ts               # framework-agnostic game loop (pure reducer + facade)
  matching.ts           # name matching + fuzzy autocomplete resolution (pure)
  storage.ts            # StorageProvider abstraction over localStorage (SSR-safe)
  gameStorage.ts        # daily save/resume + per-game stats log (keyed by seed)
  dataLoader.ts helpers.ts    # dataset fetch + RNG/daily-number/util helpers
  index.html            # shared game page template (Daily + Practice)
  index.ts              # home page — Daily game
  practice.ts           # Practice page — random player + Play Again
  faq.* profile.*       # additional pages
  ui/mountGame.ts       # wires the DOM to the game logic
  ui/autocomplete.ts    # type-ahead dropdown DOM wiring (uses matching.ts)
  ui/modal.ts           # end-of-game win/loss modal (+ confetti on win)
  _header.html / _footer.html # shared HTML partials
  style.css             # Tailwind entry
  assets/               # SVG assets
test/                   # Jest tests (game, matching, autocomplete, storage, …)
webpack.config.js       # multi-page build + dev server config
tasks/                  # task tracking (see below)
```

## Project status

**V1 is complete.** Work is tracked as individual tasks under `tasks/` (managed
with `tatr`); the planning breakdown lives in `tasks/20260701-083457/TASK.md`,
split into steps 0–6.

Every V1 step is done: project setup, the Webpack multi-page build, the starter
dataset, the framework-agnostic game loop, and the playable Daily + Practice
pages. `npm run build` produces a working standalone `dist/`, and the game logic
is covered by the Jest suite (94 tests across `game`, `matching`/autocomplete,
`storage`/`gameStorage`, and `helpers`). Follow-up ideas are gathered in the V2
breakdown (`tasks/20260701-105230/TASK.md`); V2 Steps 7 (fuzzy autocomplete),
8 (win/loss modal with confetti), and 9 (localStorage persistence + Daily
numbering) are complete.

### Out of scope for V1

Deliberately deferred so the initial scope stays small:

- ~~Fuzzy name matching and autocomplete~~ — **added in V2** (see
  `tasks/20260701-111642/TASK.md`); V1 shipped with case/whitespace/accent
  normalization only and expected otherwise-correct spelling
- A large or externally sourced dataset (V1 uses a small hand-picked list)
- Club crests / images and difficulty levels
- Accounts, persistence, or leaderboards
