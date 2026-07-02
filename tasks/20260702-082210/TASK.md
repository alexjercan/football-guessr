# V4.2 — Recolor & restyle core surfaces (header, game, autocomplete, modal, profile) + turf/chalk touches

- STATUS: CLOSED
- PRIORITY: 62
- TAGS: ux,design,css

Parent spike: `tasks/20260702-080715/TASK.md`. Depends on **V4.1**
(`tasks/20260702-082208`) — the palette + renamed vars must land first.

## Goal

With the new pitch-green vars in place, sweep the **core surfaces** so they read
as football, not just recolored. Restyle framing, borders, and spacing per
component and add the tasteful, *purposeful* football touches agreed in the
spike kickoff.

The **hint drawer** (V4.3), **main game-view motifs / kit-number badges**
(V4.4), and **confetti** (V4.5) are their own tasks — this task covers the rest.

## Surfaces in scope

- **Header** (`.game-title`, `.profile-button`) + **footer** links
- **Game card shell** (`.game`, `.game__clubs`, `.game__form`, input + buttons,
  `.game__status`, `.game__play-again`, `.game__go-practice`) — the *base*
  recolor/restyle; the game-view football motifs are explored in V4.4
- **Autocomplete dropdown** (`.autocomplete*`)
- **End-of-game modal** (`.modal*`, incl. `--win` / `--loss` states)
- **Profile / stats page** (`.profile*`, incl. the guess-distribution bar chart)

## Football touches (decisions from kickoff)

- **Turf background:** add a **subtle striped / mowed-pitch gradient** to the
  body (the user approved this). Keep it very subtle — must not hurt text
  contrast or feel busy. CSS gradient only, no heavy image assets.
- **Chalk-line dividers:** use the chalk-white line color for dividers/borders
  where a "pitch line" reading makes sense (e.g. under the header). Motifs must
  **serve a purpose** — chalk lines where there are lines; don't sprinkle
  decoration for its own sake.
- **Win/loss accents:** keep gold (win) and red (loss) — they already read as
  trophy-gold and a red card. Only *minimal* tweaks to lean slightly more
  football; confirm both stay legible on the green background.

## Checklist

- [x] Header + footer recolored/restyled; chalk-line divider under header
- [x] Game card shell recolored/restyled (motif exploration deferred to V4.4)
- [x] Autocomplete dropdown recolored
- [x] Modal recolored; win/loss accents preserved and legible on green
- [x] Profile page + distribution bar chart recolored
- [x] Subtle turf gradient on the body background
- [x] No heavy assets / perf regressions; `npm run build` succeeds

## Implementation summary

Because every surface already reads from the shared CSS vars, the **recolor**
across header/footer, game card, autocomplete, modal, and profile was carried by
the V4.1 palette+rename — no per-surface color edits needed. V4.2 added the two
football *restyle* touches (`src/style.css`):

- **Turf background** on `body`: a very faint (`0.04` alpha) 90px/180px vertical
  `repeating-linear-gradient` — reads as mowed-pitch stripes without hurting
  contrast. Pure CSS, no assets.
- **Chalk touchline** under the header: `border-bottom` changed from a green
  2px to `var(--chalk)` (pitch-line motif) with a faint green glow
  (`box-shadow: 0 2px 12px var(--pitch-glow-faint)`) so it still ties to the
  accent.

Win (gold) / loss (red) accents left unchanged; verified the gold stat values
and green accents stay legible on the new background.

**Verified visually** (webpack dev server + headless Chromium screenshots) on
Daily and Profile: green title, chalk line, subtle turf stripes, green card
glows/buttons/tabs, gold stat values all read coherently. `npm run build`
passes. Deep game-card motifs (kit numbers) are V4.4; the hint drawer visible in
the Daily shot is intentionally left to V4.3 (its shield placeholder is V3 art).
The win/loss modal itself gets its full check in V4.6.

## Out of scope

- Hint drawer (V4.3), game-view kit-number badges / deeper motifs (V4.4),
  confetti retune (V4.5), the final a11y + verification pass (V4.6).
