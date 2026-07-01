# Football Guessr

Guess the mystery footballer from the clubs they've played for. You start with a
single club as a hint — every wrong guess reveals the next club in that player's
career, so the longer you take, the more career history you have to work with.

> **Status:** V1 in progress. The scaffolding, build pipeline, and dataset are in
> place; the core game loop and the playable UI are still under construction. See
> [Project status](#project-status) below.

## How to play

- You're shown one of a mystery player's former clubs as your first hint.
- Type a guess for the player's name and submit it.
- **Wrong guess** → the next club in that player's career (chronological order) is
  revealed as an extra hint.
- **Correct guess** → you win.
- You get up to **25 guesses** total.
- If the player's clubs run out before you hit 25 guesses, no new hints appear —
  but you can keep guessing until the limit.
- Reach 25 guesses without the right answer → **Game Over**, and the answer is
  revealed.

Guessing is case-insensitive and ignores surrounding whitespace.

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

Then open <http://localhost:8080>.

### Build

Produce a static bundle in `dist/`:

```bash
npm run build
```

The contents of `dist/` can then be served by any static file server.

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
  index.html / index.ts # home page — the game
  practice.* faq.* profile.*  # additional pages (scaffolded)
  _header.html / _footer.html # shared HTML partials
  style.css             # Tailwind entry
  assets/               # SVG assets
test/                   # Jest tests
webpack.config.js       # build + dev server config
tasks/                  # task tracking (see below)
```

## Project status

Work is tracked as individual tasks under `tasks/` (managed with `tatr`). V1 is
broken into steps 0–6; the initial planning breakdown lives in
`tasks/20260701-083457/TASK.md`. At the time of writing, project setup, the
Webpack build, and an initial dataset are done, while the core game loop and the
playable HTML page are still to be built.

### Out of scope for V1

Deliberately deferred so the initial scope stays small:

- Fuzzy name matching, autocomplete, or accent-insensitive input
- A large or externally sourced dataset (V1 uses a small hand-picked list)
- Club crests / images and difficulty levels
- Accounts, persistence, or leaderboards
