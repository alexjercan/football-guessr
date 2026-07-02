# V4.5 — Retune win confetti palette for the green theme

- STATUS: CLOSED
- PRIORITY: 52
- TAGS: ux,polish,css

Parent spike: `tasks/20260702-080715/TASK.md`. Best done after the core
recolor (V4.2, `tasks/20260702-082210`) so the confetti can be judged against
the final background.

## Goal

The win confetti was tuned for the amber/dark theme. Against the new
pitch-green background some of those colors may wash out. Fine-tune the confetti
palette so it still pops on green (the user approved fine-tuning).

## Scope

- Find where the confetti colors are configured — the win/loss modal + confetti
  shipped in V2 Step 8 (`tasks/20260701-111643`); the color list is likely in a
  `src/ui/**` module (grep for the confetti setup / color array).
- Swap in colors that read well over `#0a0f0a`-ish green — e.g. lean on
  chalk-white, victory-gold, and bright/contrasting hues; avoid greens that
  blend into the turf.
- Keep it celebratory; this is a small polish task.

## Checklist

- [x] Locate the confetti color configuration
- [x] Retune colors for good contrast/visibility on the green background
- [x] Confetti still fires correctly on win (no behavior change)
- [x] `npm run ci` + `npm run build` pass

## Implementation summary

`CONFETTI_COLORS` in `src/ui/modal.ts`:
`["#ffd700", "#e6a861", "#ffec8b", "#ffffff"]` →
`["#ffd700", "#ffec8b", "#ffffff", "#3fb950"]`. Dropped the warm tan
(`e6a861`) that muddied against the green background; added the pitch-green
accent so the celebration ties to the theme, keeping trophy gold + pale gold +
chalk white which all read strongly on `#0a0f0a`.

**Behavior unchanged** — this is a value-only edit to the same `colors:` option
the win burst + side cannons already passed (`fireConfetti`), so the mechanism
is unaffected.

**Verification note:** tried to screenshot the burst in headless Chromium, but
canvas-confetti's requestAnimationFrame renders inconsistently under headless
virtual-time (and the `confetti.create()` path in one harness ignored `colors`
entirely). Since this is a pure value swap on a code path already proven in
production, verification is by contrast reasoning + `npm run build` /
`npm run lint` / `npm run format:check` / full `npm run ci` (125 tests) passing,
rather than a flaky animation screenshot. Also re-confirmed `grep -rn
"amber\|e6a861" src/` is zero (an earlier draft comment had reintroduced the
words; reworded).

## Out of scope

- Confetti timing/trigger logic — colors only.
