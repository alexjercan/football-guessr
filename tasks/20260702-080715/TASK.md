# V4 Spike — Football-themed Color Scheme & Layout Polish

- STATUS: CLOSED
- PRIORITY: 65
- TAGS: spike,ux,design,css

## Spike outcome — broken down into subtasks

The open questions are resolved (see the answers inline under "Open questions"
below) and the work is split into six implementation tasks. Suggested order
follows priority; V4.1 is the foundation and V4.6 is the final sign-off.

- **V4.1** `tasks/20260702-082208` — Pitch-green palette + rename amber CSS vars
  *(foundation — do first)*
- **V4.2** `tasks/20260702-082210` — Recolor & restyle core surfaces
  (header, game, autocomplete, modal, profile) + turf/chalk touches
- **V4.3** `tasks/20260702-082211` — Rethink & restyle the hint drawer with
  football ideas *(the user disliked the current sidebar)*
- **V4.4** `tasks/20260702-082215` — Football motifs in the main game view
  (kit-number badges, chalk lines)
- **V4.5** `tasks/20260702-082216` — Retune win confetti palette for green
- **V4.6** `tasks/20260702-082217` — Accessibility + cross-page verification &
  CI gate *(final — do last)*

## Goal

Make the game *look* like a football game. Today the UI wears a generic dark
"amber glass" skin (`--amber-glow` / `--bg-dark` in `src/style.css`) that has
nothing to do with football — it reads as a sci-fi/terminal theme. This spike
reworks the color scheme and CSS styling toward a **pitch green + dark** look so
the theme reinforces the subject matter the moment the page loads.

This is a **spike**: the deliverable is a validated palette + restyle applied to
the real pages (not a throwaway prototype), plus notes on anything that turns
out to need a follow-up task. It is intentionally scoped to *presentation only* —
no game-logic, data, or behavior changes.

## Decisions locked in (from kickoff Q&A)

- **Direction: "Pitch green + dark."** Keep the dark base; replace the amber
  accent with grass/pitch green and add chalk-white "pitch line" detailing.
  Starting palette to iterate from:
  - `bg`: `#0a0f0a` (near-black, faint green cast)
  - accent: `#3fb950` (pitch green)
  - lines: `#e8e8e8` (chalk white) for markings / dividers
  - cards: dark glass with a **green** glow (replacing the amber glow)
- **Replace, don't toggle.** The football theme fully replaces the amber theme —
  a single theme in `src/style.css`. No `[data-theme]` switcher, no second
  palette to maintain.
- **Scope = colors *and* CSS styling.** Beyond a raw variable swap, restyle the
  CSS (framing, borders, spacing, small structural touches) so it feels football,
  not just recolored. Deep markup/layout restructuring is *optional* and should
  be justified per element rather than done wholesale (see Open questions).

## Current state (what we're changing)

All theming lives in **CSS variables** at the top of `src/style.css`:

```css
:root {
    --bg-dark: #0a0c10;
    --amber-glow: #e6a861;
    --amber-dim: rgba(230, 168, 97, 0.2);
    --amber-outline: rgba(230, 168, 97, 0.35);
    --amber-glow-soft: rgba(230, 168, 97, 0.15);
    --amber-glow-faint: rgba(230, 168, 97, 0.05);
    --glass-bg: rgba(20, 24, 32, 0.85);
    --glass-border: rgba(230, 168, 97, 0.4);
    --text-main: #e0e0e0;
    --victory-gold: #ffd700;
    --danger-red: #ff4a4a;
    --node-bg: #151820;
    --line-color: #555;
}
```

The `--amber-*` vars are referenced **pervasively** (~60+ usages) across every
component: header/footer, `.game*`, autocomplete, `.modal*`, `.profile*`, and
the `.hint-panel*` / `.hint-card*` drawer. This is the double-edged sword of the
spike: because everything already reads from a small set of vars, a *recolor* is
mostly a values change — but the var **names** ("amber") will be misleading once
they hold greens, so renaming is part of doing this cleanly (see checklist).

Surfaces to cover (every page/component must stay coherent):

- **Header** (`.game-title`, `.profile-button`) + **footer** links
- **Game card** (`.game`, `.game__clubs`, `.game__form`, input + buttons,
  `.game__status`, `.game__play-again`, `.game__go-practice`)
- **Autocomplete dropdown** (`.autocomplete*`)
- **End-of-game modal** (`.modal*`, incl. `--win` gold / `--loss` red states)
- **Profile / stats page** (`.profile*`, incl. the guess-distribution bar chart)
- **Hint drawer** (`.hint-panel*`, `.hint-card*`, `.hint-guess*`)
- **Confetti** win effect — check the colors still read against a green bg

## Suggested approach

1. **Define the new palette as CSS vars first.** Land the green/chalk values and
   a clear var-naming scheme; get the base + one component (the game card)
   looking right before touching the rest.
2. **Rename vars away from "amber".** e.g. `--pitch-green`, `--pitch-glow`,
   `--chalk`, `--turf-*`, `--glass-*`. Do it as a mechanical find-and-replace so
   no stale `--amber-*` names remain (grep to confirm zero references).
3. **Sweep component by component** in the order listed above, checking each in
   the browser. Keep `--victory-gold` and `--danger-red` semantically distinct
   from the new accent so win/loss states still pop against green.
4. **Add football-flavored CSS touches** (justified, not gratuitous): e.g. a
   chalk-line divider under the header (evokes a pitch line), a subtle turf
   texture/gradient on the body background, pill/kit-number styling on badges.
   Keep it tasteful and performant (no heavy images).
5. **Verify** across Daily, Practice, and Profile pages at desktop + mobile
   widths, then run the full CI gate.

## Open questions (resolve during the spike)

- **Turf texture vs. flat green?** Does the body get a subtle striped/mowed-pitch
  gradient, or stay flat near-black-green? (Lean: very subtle or flat — must not
  hurt text contrast or feel busy.) - I would also go with Lean, it shouldn't
  affect the gameplay but it's nice to have a striped/mowed-pitch style
  gradient.
- **How far do football motifs go?** Chalk-line dividers and kit-number badges
  are cheap wins. Do we want more (e.g. a goal-net or hexagon-ball motif, corner
  flag accents)? Risk of kitsch — decide per element. - I think we can decide
  per each element. We should add at least some motifs, that is good. But we
  shouldn't exagerate and add them just to add them. They should serve a
  purpose. e.g the kit numbers make sense in guesses, or chalk-lines make sense
  for lines.
- **Win/loss accents.** Keep gold/red as-is, or theme them too (e.g. gold →
  trophy gold is fine; red is the classic "card" red — arguably *more* football
  now)? Confirm they stay legible on the new bg. - honestly it makes sense we
  keep them, maybe minimal changes here to make them even more football, but
  colors seem fine.
- **Confetti palette.** The win confetti was tuned for the amber/dark theme —
  does it need new colors to read against green? (Find where confetti colors are
  set; likely in a `src/ui/**` module.) - I think we can fine tune them sure
- **Any real layout restructure?** Q&A left layout scope open ("also changing the
  colors and CSS styles"). Default is *restyle in place*; flag any element where
  a structural change (e.g. header → scoreboard bar) clearly earns its cost, but
  don't restructure wholesale in this spike. - I don't really like the hint
  sidebar, I would restyle that one a bit. And with football ideas I think we
  can make it better. This can be explored on how to improve it. Also the main
  game view might get some changes too since we add football motifs, that one
  can be explored aswell.
- **Accessibility.** Pitch green on dark can be low-contrast for body text —
  keep `--text-main` a near-white, verify WCAG AA on text and interactive
  states, and don't rely on green-vs-green alone to signal focus/active.
  - really important is to have GOOD contrast and a REALLY GOOD UX

## Checklist

- [ ] Land the new pitch-green/chalk palette as CSS vars in `src/style.css`
- [ ] Rename `--amber-*` vars → football-meaningful names; grep confirms no
      stale `--amber-*` (or other old names) remain anywhere
- [ ] Recolor + restyle every surface listed above (header/footer, game card,
      autocomplete, modal, profile, hint drawer)
- [ ] Preserve win (gold) / loss (red) semantics; verify legibility on green
- [ ] Check confetti colors against the new background; retune if needed
- [ ] Add tasteful football CSS touches (chalk-line divider, subtle turf,
      badge styling) — no heavy assets, no perf regressions
- [ ] Verify visually on Daily (`/`), Practice (`/practice`), and Profile at
      desktop + mobile widths
- [ ] Confirm accessibility: text contrast AA, visible focus states
- [ ] Run `npm run ci` (format:check + lint + test) and `npm run build`
- [ ] Update `README.md` "Tech stack"/theme mentions if the amber theme is
      described anywhere
- [ ] Note any deferred follow-ups (e.g. layout restructure, theme toggle)

## Out of scope

- Game logic, dataset, matching, or persistence changes.
- New binary art assets (crests/photos) — that's the V3 task
  (`tasks/20260701-185929`).
- A theme switcher / second palette — explicitly decided *replace*, not toggle.

## Relates to

- Touches the same CSS the V2 hint-panel task styled
  (`tasks/20260701-111646`) and the profile page (`tasks/20260701-111645`).
- Independent of V3 art assets (`tasks/20260701-185929`) but should leave the
  crest-card styling coherent with the new palette.
