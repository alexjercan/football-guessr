# UI/UX polish — two-column game screen + type scale + consistency pass

- STATUS: CLOSED
- PRIORITY: 60
- TAGS: ux,ui,design,layout,polish

Make the app feel professional and shippable by fixing the three things that
read as "unfinished": weak type hierarchy (everything is small/caption-sized),
a cluttered and **detached** top-center composition (the hint drawer floats as a
separate island beside the game card on desktop), and a mobile header collision.
Stay within the shipped pitch-green theme.

## Requirements-only plan (source of truth for scope)

**`docs/plans/2026-07-02-003-feat-ui-ux-polish-two-column-plan.md`** — produced
via `ce-brainstorm`; contains the full Product Contract (R1–R6, acceptance
signals, scope boundaries, assumptions, open questions). Next step is `ce-plan`
to enrich it to an implementation-ready plan.

## Chosen direction

**B — two-column "matchday" layout** (chosen over a unified single panel and a
minimal hints-on-demand option, via directional browser mockups):

- **Wide screens:** one connected, bordered unit — play column (mode, large club
  name, input, guesses-left/status) beside an always-visible hints column
  (career path, wrong guesses). No detached/floating drawer on desktop.
- **Narrow screens:** single-column play + the on-demand full-width hint drawer
  (pull tab, unseen-hint dot) — reusing the mobile model from the mobile-drawer
  work.
- **Baseline (all viewports):** bump the type scale (big club name, quieter
  labels); fix the mobile header title being clipped by the profile avatar;
  consistency pass aligning the game screen to the Profile page (spacing, type,
  containment) + light touch-ups on Profile/FAQ/win-loss modal.

## Constraints

- Presentation only — no game-logic/data/persistence change.
- Pitch-green theme stays (no re-theme); preserve WCAG AA contrast + visible
  focus states.
- The open/close drawer contract becomes **narrow-screen-only** (desktop shows
  hints persistently, dropping the pull-tab/toggle there).

## Dependency / sequencing

Builds on the mobile hint-drawer work (**PR #1**, branch
`fix/mobile-hint-drawer-overlap`) as the mobile baseline. This polish work and
PR #1 both restructure the same `src/index.html` + `.hint-panel*` CSS — **merge
PR #1 first, then branch this off it** to avoid conflicts.

## Out of scope

New features/pages; dataset or crest art (V3, `tasks/20260701-185929`); a theme
toggle; re-layouts of Profile/FAQ beyond the consistency pass; reducing blank
space as a standalone goal (addressed incidentally by the two-column layout).
