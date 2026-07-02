# V4.1 — Pitch-green palette + rename amber CSS vars

- STATUS: CLOSED
- PRIORITY: 64
- TAGS: ux,design,css,foundation

## Implementation summary

Landed the pitch-green palette and renamed the `--amber-*` vars in
`src/style.css`:

- `:root` values swapped — `--bg-dark` `#0a0c10` → `#0a0f0a`, accent
  `#e6a861` → `#3fb950`, glass bg/border/node-bg given a faint green cast; added
  `--chalk: #e8e8e8` for pitch-line detailing (unused until V4.2 by design).
- Renamed vars (mechanical, longest-first to avoid substring corruption):
  `--amber-glow` → `--pitch-green` (46 refs), `--amber-dim` → `--pitch-dim`
  (11), `--amber-glow-soft` → `--pitch-glow-soft` (5),
  `--amber-glow-faint` → `--pitch-glow-faint` (8),
  `--amber-outline` → `--pitch-outline` (3). `--glass-*`, `--text-main`,
  `--victory-gold`, `--danger-red` kept as-is.
- Dropped the dead `--line-color` var (defined, never referenced).
- `src/ui/modal.ts`: the one non-CSS `amber` hit was the confetti color comment;
  reworded it and flagged the retune as V4.5 (colors themselves left unchanged —
  that's V4.5's scope).

Verified: `grep -rn "amber" src/` → 0, no stale `--amber` refs, `npm run build`,
`npm run lint`, and `npm run format:check` all pass. (Note: `format:check` only
covers .ts/.html/.js, not .css.)

Parent spike: `tasks/20260702-080715/TASK.md` (V4 — Football-themed Color
Scheme & Layout Polish). **This is the foundation task — do it first**; every
other V4.x task builds on the palette + var names landed here.

## Goal

Replace the dark "amber glass" palette with a **pitch green + dark** palette,
defined as CSS variables at the top of `src/style.css`, and rename the
`--amber-*` variables to football-meaningful names so nothing lies about its
color once it holds green.

## Starting palette (iterate from these)

- `bg`: `#0a0f0a` — near-black with a faint green cast
- accent: `#3fb950` — pitch green (replaces `--amber-glow`)
- lines: `#e8e8e8` — chalk white, for markings / dividers
- cards: dark glass with a **green** glow (replaces the amber glow)

Keep `--victory-gold` (`#ffd700`) and `--danger-red` (`#ff4a4a`) as distinct
semantic accents (their treatment is V4.2) — they must not collapse into the
green accent.

## Scope

- Land the new values in `:root` in `src/style.css`.
- Introduce a clear naming scheme, e.g. `--pitch-green`, `--pitch-glow`,
  `--pitch-glow-soft`, `--pitch-glow-faint`, `--pitch-outline`, `--chalk`,
  `--turf-*`, keeping `--glass-*`, `--text-main`, `--node-bg`, `--victory-gold`,
  `--danger-red`.
- Mechanical find-and-replace of every `--amber-*` reference across `style.css`
  (~60+ usages) to the new names — pure rename, no per-component restyling yet
  (that's V4.2+). The page should still render coherently (just green) after
  this task.

## Checklist

- [x] New pitch-green/chalk values in `:root`
- [x] All `--amber-*` vars renamed to football-meaningful names
- [x] `grep -rn "amber" src/` returns **zero** hits (vars, classes, comments)
- [x] Page still renders without broken/undefined-var styling
- [x] `npm run build` succeeds

## Out of scope

- Component-level restyling, motifs, turf gradient (V4.2).
- Hint drawer rethink (V4.3), game-view motifs (V4.4), confetti (V4.5).
