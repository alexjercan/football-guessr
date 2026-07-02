# Create FAQ page that explains how the game works

- STATUS: CLOSED
- PRIORITY: 100
- TAGS: docs,ux

## What changed

Implemented via the `/lfg` pipeline; shipped in **PR #6**
(https://github.com/alexjercan/football-guessr/pull/6, merged to `master`).

- Populated the previously-empty `/faq` page (`src/faq.html` `<main>`) with
  static, accurate content: the goal, how a round works (one club to start,
  each wrong guess reveals the next, 25 guesses), Daily vs Practice, the career
  path, accent-insensitive matching, the emoji-grid share, and where stats live.
- Added themed, responsive `.faq-*` rules to `src/style.css` (via the `:root`
  custom properties, mirroring the Profile page). Presentation-only — no game
  logic, data, or `faq.ts` behavior changed.
- Plan: `docs/plans/2026-07-02-005-feat-faq-page-content-plan.md`.
