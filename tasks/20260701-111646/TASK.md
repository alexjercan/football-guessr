# V2 Step 11 — Guess/Hint Info Panel

- STATUS: CLOSED
- PRIORITY: 70
- TAGS: ux,polish

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 11.

## Implementation summary

Built a side hint panel that sits beside the game card (stacks below it on
narrow screens), defaulting **open** with a "Hide hints / Show hints" toggle.
It shows the revealed clubs as crest cards (newest first, the latest flagged
"Latest") and the past **wrong** guesses as a scrollable stack.

Files:
- `src/ui/panel.ts` — new module. Open/close state machine
  (`openPanel` / `closePanel` / `togglePanel` / `isPanelOpen`), `renderPanel(view)`
  (a pure projection of `GameView`), plus `createClubCard` / `createGuessCard` /
  `clubInitials` helpers. Owns only the DOM (cached lookups like `modal.ts`);
  no-ops if the panel markup is absent.
- `src/assets/crest-placeholder.svg` — shared generic shield used as the crest
  placeholder (bundled automatically via the TS import → webpack `asset/resource`).
- `src/index.html` — wrapped the game card + panel in a `.game-layout` flex row;
  added the `#hint-panel` markup (toggle lives outside the collapsing panel).
- `src/style.css` — `.game-layout` / `.hint-panel*` / `.hint-card*` /
  `.hint-guess*` styles in the amber/glass theme, responsive at 760px.
- `src/ui/mountGame.ts` — calls `renderPanel(view)` inside `render(view)`, so it
  repaints on initial mount, every guess, and restart.

Key decisions (the ones the task left open):
- **Layout:** side panel, default open, **no `manuallyClosed` persistence** — a
  single open/closed boolean, per the task's V2 suggestion.
- **Crests:** generic shield SVG + club **initials** overlay (e.g. "PS" for Paris
  Saint-Germain). No copyrighted logos; looks intentional; swapping in real
  per-club crests later is a data/asset change only (see V3 task) — the render
  code won't change.
- **Past guesses:** name-only cards (no placeholder avatars), also per the task.
- **Won-game edge case:** the reducer appends the *correct* guess to
  `pastGuesses` on a win, so `renderPanel` drops that final entry from the
  "Wrong guesses" list (the crest cards + win modal already reveal the answer).
- **No unit test for `panel.ts`:** it's a DOM/asset module under `src/ui/**`,
  which is coverage-excluded and untested by existing convention (`modal.ts`,
  `autocomplete.ts`). Verified instead via lint, `tsc`, build, and a static
  HTML↔TS id-contract check (all 5 `#hint-panel*` ids match).

Verified: `npm run ci` (format:check + lint + test:coverage, 111 passing),
`tsc --noEmit`, and `npm run build` all pass; crest SVG emitted and referenced
by both index + practice bundles.

## Missing data / assets (deferred to V3)

The panel renders **placeholder** crests because we have no real art yet. What's
missing — real club crests, player photos, player descriptions, and a richer
`players.json` shape (club ids instead of bare strings) — plus the licensing
decision, is documented and tracked in the V3 task:

**→ `tasks/20260701-185929/TASK.md` (V3 — Club Crest & Player Art Assets +
Richer Player Data).**

The rendering hooks are already prepared: `createClubCard` in `src/ui/panel.ts`
builds the crest slot (just swap the placeholder `<img>` src for a real crest),
and `createGuessCard` is the spot to add player avatars.

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
- [x] `src/ui/panel.ts`: copy the open/close state machine verbatim
      (`openPanel` / `closePanel` / `togglePanel` / `isPanelOpen`)
- [x] Replace `renderLastGuess` with something simpler: `renderPanel(view)`
      shows a crest card per revealed club (newest flagged "Latest") and a
      scrollable list of past wrong guesses (`view.pastGuesses`)
- [x] Decide: auto-open on first hint vs. opt-in — went with **default open,
      no `manuallyClosed` tracking** (simpler, per the task's own suggestion)
- [x] `createSpeciesCard`/`createCladeCard`/`mountCard` don't exist here —
      wrote minimal `createClubCard(name, latest)` / `createGuessCard(name)`
      instead (with a placeholder crest + initials, no real art assets yet)

**This is the lowest-confidence task in this doc** — worth a quick spike to
see if it earns its complexity before fully committing, since the
"clone the code" leverage that the other tasks get from their snippets is
much weaker here.
