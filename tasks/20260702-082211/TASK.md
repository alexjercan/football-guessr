# V4.3 — Rethink & restyle the hint drawer with football ideas

- STATUS: CLOSED
- PRIORITY: 58
- TAGS: ux,design,css,explore

Parent spike: `tasks/20260702-080715/TASK.md`. Builds on the palette (V4.1,
`tasks/20260702-082208`) and the core restyle (V4.2, `tasks/20260702-082210`).

## Goal

The current hint sidebar/drawer is the weakest part of the UI — the user
explicitly **doesn't like it** and wants it reworked using football ideas, not
just recolored. This is an **exploratory** task: try a couple of directions,
pick the one that improves the UX, then implement it in the pitch-green theme.

The drawer today (`src/ui/panel.ts` + `.hint-panel*` / `.hint-card*` /
`.hint-guess*` in `src/style.css`) is a fixed right-edge slide-in showing:
revealed clubs as crest cards (newest flagged "Latest") and past wrong guesses
as a scrollable stack, with a vertical "pull tab" when closed.

## Directions to explore

- Football-flavored framing for the revealed-clubs list — e.g. a **career
  timeline / transfer path** reading (clubs as a chronological career line),
  since the clubs already reveal in chronological order.
- Reconsider the **drawer form factor** itself (slide-in drawer vs. inline panel
  vs. something better) if it improves the UX — flag any markup change in
  `src/index.html`, but keep it presentation-only (no game-state changes).
- Kit-number / squad-list styling for entries where it serves a purpose (note:
  kit numbers on *guesses* are the main game view — V4.4; keep the two coherent).
- Restyle the pull tab / close affordance to fit the theme.

## Constraints

- Presentation only — do **not** change the panel's open/close state machine
  contract or `renderPanel(view)`'s data inputs; `panel.ts` is a DOM module
  (coverage-excluded, untested by convention — verify via lint/tsc/build +
  the HTML↔TS id-contract check).
- Keep the placeholder-crest path working (real crests are the separate V3 task,
  `tasks/20260701-185929`); leave crest-card styling coherent with the palette.
- Keep it accessible (focus states, contrast) — the deeper a11y audit is V4.6.

## Checklist

- [x] Explore 1–2 football-flavored drawer directions; pick one, note the call
- [x] Implement the chosen restyle in the pitch-green theme
- [x] Any `src/index.html` markup change stays presentation-only; ids still match
      `panel.ts` (id-contract check passes)
- [x] Pull tab / close affordance themed
- [x] `npm run ci` + `npm run build` pass

## Implementation summary

Kept the slide-in drawer **form factor** (its open/close state machine is solid
and re-architecting it risks the contract) and instead gave it a strong football
reframe:

- **"Career path" timeline** for the revealed clubs (the winning direction — the
  clubs already reveal in career order). Renamed the section heading
  `Revealed clubs` → `Career path` in `src/index.html`; added a dashed
  **chalk rail** (pitch-marking motif) down the left of `.hint-panel__clubs`
  with a **node dot per club** (`.hint-card::before`), and the latest club's
  node lights up green (`.hint-card--latest::before`) like a live position.
  CSS-only — no `panel.ts` DOM change needed for this.
- **Red-card chips** for wrong guesses — a wrong guess is a booking. Added a
  small red-card `<span class="hint-guess__card">` in `createGuessCard`
  (`src/ui/panel.ts`, `aria-hidden`; the name still carries meaning) + styles.
- **Theme-coherent crest placeholder** — recolored `crest-placeholder.svg` from
  the old amber strokes to chalk (outer) + faint pitch-green (inner), so the
  shields stop clashing with the green theme. Still the shared placeholder;
  real per-club crests remain the V3 task.
- **Pull-tab glyph** `⟡` → `⚽` (football) in `src/index.html`.

Verified with a static harness (theme vars + real drawer CSS/markup mirroring
`panel.ts` output, screenshotted in headless Chromium): timeline rail + glowing
latest node, chalk/green crests, red-card chips all render as intended. `npm run
ci` (125 tests, lint, format) and `npm run build` pass; all six `#hint-panel*`
ids still match between `index.html` and `panel.ts`.

Deferred/coordinated: **kit-number badges on guesses** stay in V4.4 (this task
uses the distinct red-card motif to avoid overlap); the deeper a11y contrast
audit of the drawer is V4.6.

## Out of scope

- Real crest/photo assets (V3). Game logic/data. Confetti (V4.5).
