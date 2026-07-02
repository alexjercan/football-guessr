# V4.4 — Football motifs in the main game view (kit-number badges, chalk lines)

- STATUS: CLOSED
- PRIORITY: 56
- TAGS: ux,design,css,explore

Parent spike: `tasks/20260702-080715/TASK.md`. Builds on the palette (V4.1,
`tasks/20260702-082208`) and core restyle (V4.2, `tasks/20260702-082210`).

## Goal

The main game view can get some structural/visual changes now that we're adding
football motifs (the user flagged it as worth exploring). This is an
**exploratory** task: add motifs to the game view **where they serve a
purpose** — the guiding rule from kickoff was *some motifs are good, but don't
add them just to add them*.

## Ideas to explore (adopt the ones that earn their place)

- **Kit-number badges on guesses** — the concrete example the user gave: past
  guesses styled like squad kit numbers. (Guesses render in the hint drawer via
  `createGuessCard` in `src/ui/panel.ts` and/or the game card — coordinate with
  V4.3 so the guess styling is coherent in both places.)
- **Chalk lines** for the revealed-clubs list dividers / the guess counter
  (`.game__guesses`) — pitch-line reading where there are actual lines.
- Consider whether the club-hint list (`.game__clubs`) benefits from a
  squad-sheet / lineup framing.
- Any small game-card structural tweak that a motif motivates — justify per
  element; don't restructure wholesale.

## Constraints

- Presentation only — no changes to game logic, the reducer, or `GameView`
  data. Markup edits in `src/index.html` are OK if they stay presentational and
  keep ids matching the TS modules.
- Motifs must serve a purpose (kickoff decision). Avoid kitsch (no gratuitous
  goal-net/ball emoji spam).
- Stay coherent with V4.3's drawer restyle — kit-number styling should look the
  same wherever guesses appear.

## Checklist

- [x] Kit-number badges applied where they serve a purpose (revealed clubs; see
      note on placement)
- [x] Chalk-line treatment applied only where a line reading makes sense
- [x] Any game-card structural tweak justified per element, presentation-only
- [x] ids still match TS modules; `npm run ci` + `npm run build` pass

## Implementation summary

Reframed the main game card as a **squad sheet** — CSS-only edits in
`src/style.css`, no JS/HTML change:

- **Kit-number badges on the revealed clubs** (`.game__clubs`). Each revealed
  club wears its reveal order as a shirt-number patch (chalk-bordered rounded
  square, tabular digits) via a CSS **counter** (`counter-reset: kit` +
  `li::before { counter-increment; content: counter(kit) }`) — so numbering is
  automatic with zero `mountGame.ts` change and zero test risk. Made
  `.game__clubs li` a flex row to seat the badge beside the name.
- **Chalk pitch-line** above the score readout: a dashed chalk `border-top` on
  `.game__guesses`, separating the input from "Guesses left" like a scoreboard
  divider.

**Placement note (reconciling the checklist's "kit numbers on guesses"):** past
*guesses* only render in the hint drawer, where V4.3 already gave them the
distinct **red-card** motif (a wrong guess = a booking). Stacking kit numbers
there too would be redundant and muddle the two meanings. The revealed **clubs**
are the natural squad-sheet, and they carry a real career order — so the kit
numbers landed there instead. The two views stay coherent: drawer = career-path
timeline of the same clubs; main card = numbered squad sheet of them.

Verified with a static game-card harness (theme vars + real game CSS, 3 clubs,
headless-Chromium screenshot): kit badges 1/2/3 in career order + the chalk
divider render cleanly. `npm run ci` (125 tests, lint, format) and
`npm run build` pass. No markup/id changes, so the id-contract is untouched.

## Out of scope

- Hint drawer form-factor rethink (V4.3). Confetti (V4.5). Real assets (V3).
