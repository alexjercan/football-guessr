# Mobile hint-drawer UX — auto-open overlaps the game card on narrow screens

- STATUS: OPEN
- PRIORITY: 48
- TAGS: ux,mobile,followup

Spun out of the V4 theme spike sign-off (`tasks/20260702-082217`, V4.6). Found
while screenshotting Daily at a 390px mobile width.

## Problem

The hint drawer (`#hint-panel`) **auto-opens on the first revealed hint**
(`renderPanel` sets `open = true` when the revealed-club count grows, unless the
player manually closed it). On desktop it sits beside the game card; on a narrow
screen the drawer is `max-width: 85vw` fixed to the right edge, so when it
auto-opens it **covers almost the entire game card** — the player lands on a
screen where the input and clubs are hidden behind the drawer.

This is **pre-existing behavior** (not introduced by the V4 restyle) — V4.3
deliberately kept the drawer's open/close state machine untouched — but the V4
verification pass is where it got noticed, so it's filed here rather than
silently left.

## Options to consider (presentation/behavior, no game-logic change)

- **Don't auto-open on narrow screens** — gate the auto-open in
  `src/ui/panel.ts` on a viewport/media check (e.g. skip when
  `matchMedia("(max-width: 760px)")` matches), leaving the pull tab to open it
  on demand. Smallest change.
- **Mobile bottom-sheet treatment** — on narrow widths, style the drawer as a
  bottom sheet or an inline panel below the game card instead of a full-height
  right overlay, so it never hides the input. CSS-heavier.
- **Backdrop + narrower default** — keep auto-open but add a dismiss backdrop and
  ensure the game card stays partly visible.

## Pointers

- Auto-open logic: `src/ui/panel.ts` `renderPanel()` (the
  `isNewHint && !manuallyClosed` block near the end).
- Drawer sizing: `.hint-panel { width: 300px; max-width: 85vw; ... }` in
  `src/style.css`.
- The open/close state machine (`openPanel`/`closePanel`/`closePanelManually`/
  `isPanelOpen`) is the contract to preserve — V4.3 notes it should not change.
- You can check out the
  <https://raw.githubusercontent.com/alexjercan/metajurassic/refs/heads/master/src/style.css>
  to see how the mobile drawer was implemented for `metajurassic` (a similar
  right-side panel that auto-opens on first hint).

## Also parked from the V4 spike (lower priority, not yet filed)

- **Theme toggle** — V4 deliberately *replaced* the amber theme rather than
  keeping a switcher (`tasks/20260702-082208`). A future `[data-theme]` toggle
  (e.g. pitch-green ↔ a light "matchday" theme) is possible but not requested.
- **Deeper layout restructure** — e.g. header → a scoreboard bar. The spike kept
  restyle-in-place; a structural pass could be its own task if wanted.

