# Agent Instructions

Football Guessr is a browser game: guess the mystery footballer from the clubs
they have played for, with the next career club revealed on each wrong guess. It
is a **static, client-side TypeScript app** bundled with Webpack — there is no
backend. Game state and stats persist in the browser's `localStorage`.

`AGENTS.md` is the canonical repo instruction file. Root `CLAUDE.md` exists only
as a compatibility shim that `@`-includes this file for harnesses that auto-load
`CLAUDE.md`.

## Quick Start

```bash
npm install
npm run serve   # webpack-dev-server at http://localhost:8080 (Daily at /, Practice at /practice)
npm run build   # production build -> dist/
npm run ci      # format:check + lint + test:coverage — the gate before every PR
```

A Nix flake provides an optional reproducible dev shell (`nix develop`).

## Task Management (source of truth)

- **`tatr` tasks under `./tasks/` are the single source of truth for what needs
  to be done.** Consult them before starting work; keep each task's `STATUS`
  current (`OPEN` -> `IN_PROGRESS` -> `CLOSED`); and record what actually changed
  in that task's `TASK.md` when you close it.
- Create with `tatr new "<title>" -p <priority> -t <tags>`; list with
  `tatr ls --sort priority`. Each task is `tasks/<YYYYMMDD-HHMMSS>/TASK.md`; edit
  the `STATUS` line directly (there is no CLI edit command).
- **`./todos/` is scratch space for the agent's own thinking and brainstorming**,
  never the source of truth. Anything that must actually happen belongs in a
  `tatr` task, not in `./todos/`.

## Working Agreement

- **Branching:** `master` is the main branch. Create a feature branch for
  non-trivial work; if already on the correct branch, keep using it — do not
  spawn extra branches or worktrees unless asked.
- **Commit / push only when explicitly asked**, and never to `master` directly —
  changes to `master` go through a pull request.
- **Safety:** Do not casually delete or overwrite user data. In this app that
  includes the saved-game / stats `localStorage` schema — a breaking change to
  its shape orphans every player's history, so treat storage-format changes as
  deliberate, not incidental. Avoid destructive git/shell commands.
- **Verification gate:** Run `npm run ci` before finishing a change. For
  visual/CSS work, also confirm in the real app — the established pattern here is
  `npm run serve` + headless-Chromium screenshots, because the DOM layer is not
  unit-tested (see Testing).
- **Scratch space:** Use the OS temp dir for throwaway files; use `./todos/` only
  for agent thinking. Durable outputs (a plan or doc worth keeping) belong in a
  tracked location, not temp.

## Domain Notes (things not obvious from the code)

- **Two play modes share one template.** `src/index.html` is the Webpack template
  for **both** the Daily page (`/`) and the Practice page (`/practice`) — see
  `webpack.config.js`. A markup change to `index.html` affects both.
  - **Daily** is seeded by the UTC date (everyone gets the same puzzle, numbered
    like Wordle), saves after every guess, and resumes mid-game on reload.
  - **Practice** picks a random player, is intentionally **not** resumed, and
    writes a record only once the game ends.
- **Stats are derived, not logged.** There is no results log; `gameStats.ts`
  replays each saved game's guesses against its player to compute the profile
  page. Keep it consistent with `game.ts` if you change the reducer.
- **The dataset is generated, and clubs are entities.** Edit
  `src/data/players.source.json` (clubs written as plain display names), then run
  `npm run gen:data` to regenerate `players.json` (clubs as stable ids) and
  `clubs.json` (id → `{ name, country?, crest? }`). Never hand-edit the two
  generated files. The loader resolves club ids back to display names, so
  `PlayerEntry.clubs` stays `string[]` and the reducer/matching/stats are
  unaffected. **Saved-game safety:** player `id`s are storage keys — keep them
  (and each player's club order) stable, or you orphan saved games. Player
  `photo`/`description` and club `crest` are optional schema fields, unset until
  the art-assets work (V3b); clubs still render as initials.

## Directory Layout

```
src/
  game.ts          Core game reducer — framework-agnostic and pure (the heart of the logic)
  matching.ts      Fuzzy/accent-insensitive guess resolution and name matching
  dataLoader.ts    Loads players.json + clubs.json, resolves club ids -> display names
  dataGen.ts       Pure data-generation transform (slugify, club map, id-ify) — shared by the loader + generator
  gameStats.ts     Stats derivation (replays saved games)
  gameStorage.ts   Save/load a single game record
  storage.ts       localStorage provider — injectable so logic stays testable
  share.ts         Shareable result text (plain unicode)
  helpers.ts       Shared pure utilities
  types.ts         Shared types (GameView, PlayerEntry, ...)
  ui/              DOM-only modules, coverage-excluded: mountGame, modal, panel, autocomplete
  data/players.source.json  Editable dataset source (clubs as display names) — the source of truth
  data/players.json  Generated: players with clubs as club-ids (do not hand-edit)
  data/clubs.json    Generated: club id -> { name, country?, crest? } map (do not hand-edit)
  assets/          SVGs (crest placeholder, icons, share/profile glyphs)
  *.html           Page templates + _header/_footer partials (index reused for Daily+Practice)
  index.ts / practice.ts / profile.ts / faq.ts  Per-page entry points
  style.css        All theming — CSS custom properties live at :root
scripts/
  generate-data.ts Thin runner: players.source.json -> players.json + clubs.json (npm run gen:data, via tsx)
test/              Jest unit tests for the pure logic layer
tasks/             tatr tasks — the source of truth (see Task Management)
docs/solutions/    documented solutions to past problems (bugs, best practices, workflow patterns), by category with YAML frontmatter (module, tags, problem_type)
dist/              Build output (generated; never hand-edit)
```

## Coding Conventions

- **Keep game logic pure and DOM-free.** Logic (`game.ts`, `matching.ts`,
  `gameStats.ts`, ...) must not touch the DOM; all DOM code lives in `src/ui/**`.
  This split is exactly why the logic is unit-tested and the UI is
  coverage-excluded — do not erode it by importing DOM APIs into the logic layer.
- **Inject dependencies** (e.g., `StorageProvider`, an `rng` function) rather than
  reaching for globals, so behavior stays deterministic and testable.
- **Theme through CSS custom properties** at `:root` in `src/style.css`; do not
  hardcode colors in component rules. The theme is a dark pitch-green scheme.
- **UI modules own only the DOM:** cache element lookups once and no-op when the
  markup is absent (see `panel.ts` / `modal.ts` for the pattern). HTML element
  `id`s are a contract with the querying TS module — change them in lockstep.

## Testing

- `npm test` runs Jest (ts-jest) against `test/`. Add or extend tests for any
  change to the pure logic layer (`game`, `matching`, `dataLoader`, `dataGen`,
  `gameStats`, `gameStorage`, `storage`, `share`, `helpers`).
- **Coverage is enforced** via `npm run test:coverage` (part of `ci`). Global
  thresholds: branches 65 / functions 95 / lines 93 / statements 89. Excluded by
  design: `src/ui/**` (DOM-heavy), `*.d.ts`, and the page entry points
  (`index.ts`, `practice.ts`, `profile.ts`, `faq.ts`). **DOM/UI code is verified
  by running the app, not by unit tests** — don't chase coverage there.
- Do not lower a threshold to make a change pass; raise coverage or justify the
  exclusion.

## Commit Conventions

- **Conventional prefixes classified by intent, not file type.** `feat:` a new
  capability; `fix:` remedies broken or missing behavior (default when `feat:`
  and `fix:` both seem to fit); `docs:` for docs-only files; plus
  `refactor:` / `chore:` / `test:` / `style:` / `perf:` when they describe the
  change more precisely. Product content that happens to be Markdown/JSON/CSS
  (`players.json`, `style.css`, `*.html`) is **not** `docs:`.
- Heuristic: if a regression test you could write today would have failed
  *before* the change, it is a `fix:`.
- **Never add `!` or a `BREAKING CHANGE:` footer without explicit confirmation.**

<!-- Fill in for your setup, then delete this comment:
- Deployment: how/where dist/ is published (e.g., GitHub Pages, Netlify, manual).
- Any project-specific conventions or gotchas discovered over time.
-->
