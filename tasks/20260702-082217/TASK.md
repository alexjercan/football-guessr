# V4.6 — Accessibility + cross-page verification & CI gate

- STATUS: CLOSED
- PRIORITY: 50
- TAGS: ux,a11y,qa

Parent spike: `tasks/20260702-080715/TASK.md`. **Final task — do it last**,
after V4.1–V4.5 have landed. This is the sign-off pass for the whole V4 restyle.

## Goal

The kickoff put heavy weight here: *"really important is to have GOOD contrast
and a REALLY GOOD UX."* Verify the pitch-green theme is accessible and coherent
across every page and width, then run the CI gate.

## Accessibility

- **Contrast:** verify WCAG **AA** for body text and interactive states against
  the new backgrounds. Keep `--text-main` a near-white; check muted text
  (`#8a93a5`-style), buttons, and links.
- **Focus/active must not rely on green-vs-green** alone — keep visible focus
  outlines and a non-color-only cue for active/selected states.
- Sanity-check the win/loss gold/red and the guess-distribution bars for
  legibility on green.

## Cross-page verification

- Walk **Daily (`/`)**, **Practice (`/practice`)**, and **Profile** at desktop
  **and** mobile widths. Check header/footer, game card, autocomplete, modal
  (win + loss), hint drawer (V4.3), game-view motifs (V4.4), and confetti
  (V4.5) all read coherently in one theme.
- Confirm no stale `amber` naming anywhere (`grep -rn "amber" src/` → 0).

## Wrap-up

- `npm run ci` (format:check + lint + test) and `npm run build` pass.
- Update `README.md` if the amber theme is described anywhere (e.g. Tech stack /
  any theme mention) to reflect the pitch-green theme.
- Record any deferred follow-ups spun out of the spike (e.g. a future theme
  toggle, deeper layout restructure) as their own tasks.

## Checklist

- [x] Contrast AA verified for text + interactive states
- [x] Visible, non-color-only focus/active cues
- [x] Daily / Practice / Profile verified at desktop + mobile
- [x] `grep -rn "amber" src/` → 0
- [x] `npm run ci` + `npm run build` pass
- [x] README updated for the new theme
- [x] Deferred follow-ups filed as tasks

## Implementation summary

Sign-off pass for the whole V4 pitch-green restyle.

**Contrast (WCAG AA).** Computed ratios with a small alpha-flattening script
(over the real `#0a0f0a` bg / translucent card + glass backgrounds) for 15 key
pairs. **All pass AA for normal text (≥4.5)** — lowest was danger-red on glass
at 5.44 and the default button (pitch-green on pitch-dim) at 5.57; text-main,
gold, kit-number chalk, links, and button-on-accent all far higher (6–15×).

**Focus/active.** Found two gaps and fixed them in `src/style.css`:
- `#guess-input:focus` previously removed the outline and only recolored the
  border (color-only). Added a `box-shadow` focus ring — a non-color-only cue.
- The Guess button, Play-Again, go-practice link, profile-back link, title,
  profile button, and footer links had no explicit `:focus-visible` (faint UA
  ring on dark). Added a consolidated `:focus-visible { outline: 2px solid
  var(--pitch-green); outline-offset }` rule.
- Active states were already multi-cue (profile active tab = fill + border +
  text; latest club = green border + fill + glowing node + badge), not
  color-only.

**Cross-page.** Rebuilt + served, screenshotted Daily, Practice, Profile at
desktop (1000px) and mobile (390px) in headless Chromium. Theme reads coherently
everywhere — green title, chalk touchline, turf stripes, kit-number squad sheet,
career-path drawer, gold stat values, responsive 2-col profile cards.

**Housekeeping.**
- `grep -rn "amber\|e6a861" src/` → 0.
- `README.md` Tech-stack styling bullet updated to describe the dark pitch-green
  theme (turf, chalk lines, kit-number / career-path motifs). It never described
  the old amber theme, so nothing to correct — just the additive mention.
- `npm run ci` (125 tests, lint, format) and `npm run build` pass.

**Deferred follow-up filed:** the hint drawer **auto-opens on mobile and covers
the game card** (pre-existing behavior; V4.3 kept the state machine untouched).
Filed as `tasks/20260702-091541` with options (gate auto-open on narrow
screens / bottom-sheet treatment). That task also parks the two speculative
spike ideas (a future theme toggle, a deeper scoreboard-style layout
restructure) so they're tracked without spamming separate tasks.
