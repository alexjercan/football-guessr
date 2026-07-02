---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-plan-bootstrap
title: "fix: mobile hint-drawer must not obscure the game card"
created: 2026-07-02
origin: tasks/20260702-091541/TASK.md
---

# fix: Mobile hint-drawer must not obscure the game card

## Summary

On narrow/mobile viewports the hint drawer **auto-opens on the first revealed
hint** and, sized at `max-width: 85vw` on the right edge, covers almost the whole
game card — the guess input and revealed clubs are hidden behind it on load.
This plan stops the drawer from obscuring the game card on mobile via
presentation-only changes: (1) gate the auto-open so it does **not** fire on
narrow screens (the game card stays visible; the pull tab is the way in),
(2) since auto-open is today the *only* "a new hint arrived" signal, add a
closed-state **unseen-hint indicator** on the pull tab so suppressing auto-open
does not silently swallow hints, and (3) give the drawer a mobile-responsive
full-width treatment — with adequate touch targets and keyboard/focus handling —
for when the user deliberately opens it. No game logic changes; the open/close
state-machine contract is preserved.

Depth: **Standard**. Two implementation units.

---

## Problem Frame

- **Where:** `src/ui/panel.ts` (`renderPanel` auto-open heuristic, `applyOpenState`,
  `ensureWired`) and the `.hint-panel*` rules in `src/style.css`.
- **Current behavior:** `renderPanel` sets `open = true` whenever the revealed
  club count grows (`isNewHint && !manuallyClosed`), including first paint — and
  it *only ever sets `open = true`; it never sets `open = false`*. `.hint-panel`
  is `position: fixed`, vertically centered, `width: 300px; max-width: 85vw`. On a
  ~390px phone, 85vw ≈ 330px covers the game card.
- **Why it matters:** the player lands on a screen where the input and clubs are
  hidden behind an auto-opened drawer — a poor first interaction. Flagged during
  V4.6 (`tasks/20260702-082217`); V4.3 intentionally left drawer behavior alone.
- **Reference studied:** metajurassic's `src/style.css` (linked from the origin
  task) uses the same right-drawer pattern and, at `@media (max-width: 768px)`,
  converts the panel to **full-width** (`width: 100%`, left border → top border,
  `overflow-y: auto`) while keeping the same transform-based show/hide. It does
  **not** change auto-open, so it does not solve "obscures on load"; we borrow the
  full-width mobile treatment and add the auto-open gate + hint signal the origin
  task calls for.

---

## Requirements

- **R1** — At/below the mobile breakpoint, the drawer must not auto-open on a new
  hint; the game card (mode, clubs, input, guesses) is fully visible on load and
  after each guess.
- **R2** — The pull tab remains visible and usable while the drawer is closed on
  mobile, so hints are one tap away.
- **R3** — When the user opens the drawer on mobile, it presents cleanly
  (full-width, scrollable, close control reachable) rather than as an 85vw sliver.
- **R4** — Desktop behavior is unchanged (drawer still auto-opens beside the card
  and floats content-height).
- **R5** — The open/close state-machine *contract*
  (`openPanel`/`closePanel`/`closePanelManually`/`isPanelOpen`/`togglePanel`
  signatures and open/closed semantics) is unchanged. New behavior (mobile gate,
  hint indicator, Escape/focus) layers around it via `renderPanel`/
  `applyOpenState`/handlers, not by changing those exported functions' contracts.
- **R6** — WCAG AA contrast and visible, non-color-only focus states are
  preserved.
- **R7** — Because gating auto-open removes the app's only "new hint arrived"
  cue, the closed pull tab must show an **unseen-hint indicator** when the
  revealed-club count grows while the drawer is closed on mobile; opening the
  drawer clears it. (Prevents players silently missing hints they are owed.)
- **R8** — At ≤640px the primary controls — the pull tab and the close button —
  must have hit areas of at least **44×44px** (WCAG 2.5.5 / mobile norm). The
  close button is 30×30px today.
- **R9** — The full-width mobile drawer is modal-like over the card, so it must
  support **Escape-to-close** and move focus to the close button on open,
  returning focus to the pull tab on close.

Non-goals: no game-logic/data/persistence change; a dismiss **backdrop** /
tap-outside-to-close and a true bottom-sheet slide-from-below are deferred (see
Scope Boundaries). Focus is *moved*, not necessarily *trapped* (see KTD5).

---

## Key Technical Decisions

- **KTD1 — Gate auto-open with `matchMedia`, and force-close on a mobile new
  hint.** Add `isNarrowViewport()` in `panel.ts`
  (`window.matchMedia("(max-width: 640px)").matches`; treat an absent `matchMedia`
  as non-narrow so tests/old engines keep desktop behavior). In `renderPanel`'s
  auto-open block, on a new hint: if narrow, set `open = false` (force closed);
  else keep the existing `!manuallyClosed` auto-open. Forcing closed (rather than
  merely *not opening*) is what makes the desktop→mobile case correct: because the
  block only ever set `open = true` before, a drawer opened on desktop would
  otherwise stay open after crossing to mobile. Manual `openPanel()` and the pull
  tab still work on mobile — only the *automatic* pop is suppressed (R1, R4, R5).
- **KTD2 — Breakpoint = 640px, guarded against JS/CSS drift.** Below the common
  mobile boundary; the desktop `.game-layout` is 480px and the drawer 300px, so
  640px cleanly separates "fits beside the card" from "would cover it." The gate
  lives in **two** places — the JS `matchMedia` query and the CSS `@media` block —
  and a file already has an unrelated `@media (max-width: 480px)` block, so drift
  is a real risk (desync produces a band where the drawer is full-width but still
  auto-opens, reintroducing the bug). Guard it: put a cross-referencing comment at
  **both** sites naming the other and stating they must stay equal (e.g. JS:
  `// keep in sync with the 640px @media block in style.css`; CSS: the mirror).
  A shared constant isn't clean across the JS/CSS boundary for a `matchMedia`
  string, so the paired comment is the pragmatic single-notice guard.
- **KTD3 — Mobile drawer = full-width overlay, reusing the transform-based
  show/hide.** Per the metajurassic reference: at `@media (max-width: 640px)` set
  `width: 100%; max-width: 100%`, square the right-edge corners, keep
  `overflow-y: auto`, and let it slide in over the (now-static) card, keeping the
  `.active` transform contract. Verify the off-screen parked state
  (`translate(100%, -50%)` at full width) does not introduce horizontal overflow;
  if it does, park via a transform that can't overflow (e.g. keep `right` offset
  or use `translateX(100%)` with `overflow-x` contained) — confirm at screenshot
  time (R3).
- **KTD4 — No live `resize`/orientation listener; document the transient
  window.** Auto-open is re-evaluated on every `renderPanel` (initial mount + each
  guess). Combined with KTD1's force-close, a desktop→mobile crossing is corrected
  at the **next render** (next guess). The only residual is a *transient* window:
  a drawer already open when the viewport crosses 640px stays full-width over the
  card until the next guess. This is accepted for this fix — a live resize
  listener is deferred (Scope Boundaries). (Corrects the earlier, inaccurate
  "handled on the next guess" framing: guess-time re-eval alone only prevents
  *opening*; the force-close in KTD1 is what handles the already-open case.)
- **KTD5 — Escape + focus move, not a full focus trap.** On open, move focus to
  the close button; on close, return focus to the pull tab; bind an Escape
  keydown to `closePanelManually()`. A full focus trap + backdrop is deferred
  (Scope Boundaries) — Escape + focus-move is the high-value a11y core for a
  keyboard/SR user on the full-width overlay without new markup (R9, R6).

---

## Implementation Units

### U1. Gate auto-open, force-close on mobile, add hint indicator + keyboard/focus

- **Goal:** On mobile, keep the game card visible (no auto-open, and force-close
  an already-open drawer on a new hint), signal unseen hints on the closed pull
  tab, and make the opened overlay keyboard-dismissable with sane focus. (R1, R2,
  R4, R5, R7, R9)
- **Requirements:** R1, R2, R4, R5, R7, R9.
- **Dependencies:** none.
- **Files:** `src/ui/panel.ts`.
- **Approach:**
  - Add `isNarrowViewport(): boolean` returning
    `window.matchMedia?.("(max-width: 640px)").matches ?? false`. Add the KTD2
    cross-reference comment here.
  - In `renderPanel`'s auto-open block, replace `if (isNewHint && !manuallyClosed)
    { open = true }` with: on `isNewHint`, if `isNarrowViewport()` set
    `open = false` (force closed) and, when the drawer is closed, flag the pull
    tab as having unseen hints; else keep `open = true` unless `manuallyClosed`.
    Preserve `lastRevealedCount` bookkeeping and the final `applyOpenState(els)`.
  - **Unseen-hint indicator (R7):** track it with a `data-new` attribute on
    `els.pull` (no new markup; CSS renders the dot in U2). Set it when
    `isNewHint` and the drawer is/stays closed on narrow; clear it in
    `applyOpenState` whenever `open` is true (opening = seen).
  - **Escape + focus (R9, KTD5):** in `ensureWired`, add a `keydown` listener
    (Escape → `closePanelManually()`); in `applyOpenState`, on the closed→open
    transition move focus to `els.closeBtn`, and on open→closed return focus to
    `els.pull`. Do **not** change the signatures/semantics of `openPanel`/
    `closePanel`/`closePanelManually`/`togglePanel`/`isPanelOpen` (R5).
- **Patterns to follow:** the existing auto-open block and `applyOpenState`
  (which already toggles `.active`, `aria-hidden`, `aria-expanded`, and
  `els.pull.hidden`) — extend it; the existing `ensureWired` handler-attach
  pattern for the Escape listener.
- **Execution note:** presentation/behavior only; verify by running the app.
- **Test scenarios:** `Test expectation: none — src/ui/** is DOM-only and
  coverage-excluded by project convention (jest.config.js); verified by running
  the app at mobile and desktop widths (see Verification Contract).`

### U2. Mobile-responsive drawer styling (full-width, touch targets, hint dot)

- **Goal:** The opened drawer presents as a clean, full-width, scrollable overlay
  at ≤640px with ≥44px touch targets, and the closed pull tab renders the unseen-
  hint dot. Desktop unchanged. (R3, R4, R6, R8, and the CSS half of R7)
- **Requirements:** R3, R4, R6, R7, R8.
- **Dependencies:** none (independent of U1; together they satisfy the task —
  U1 sets `data-new`, U2 styles it).
- **Files:** `src/style.css`.
- **Approach:** Add an `@media (max-width: 640px)` block (with the KTD2
  cross-reference comment) overriding `.hint-panel` to `width: 100%; max-width:
  100%`, squaring the right corners and keeping `.hint-panel__body`
  `overflow-y: auto`; keep the `.active` transform contract. Enlarge the pull-tab
  and `.hint-panel__close` hit areas to ≥44×44px at this breakpoint via
  `min-width`/`min-height`/padding (R8). Add `.hint-panel-pull[data-new]` styling
  — a small dot/badge using existing theme custom properties (e.g. a
  `--pitch-green` or `--victory-gold` pseudo-element dot), legible on the tab
  (R7). Preserve existing `:focus-visible` outlines (R6). No new colors.
- **Patterns to follow:** the existing `@media (max-width: 480px)` block for
  override shape; the metajurassic full-width mobile rule; existing
  `:focus-visible`/`--pitch-*` conventions.
- **Execution note:** CSS only; verify visually at ≤640px and >640px.
- **Test scenarios:** `Test expectation: none — CSS/theme change; verified by
  screenshots at mobile and desktop widths (see Verification Contract).`

---

## Verification Contract

Project convention (`AGENTS.md`, `jest.config.js`): `src/ui/**` and styling are
**not** unit-tested — verified by running the app. Gates:

- `npm run ci` (format:check + lint + test:coverage) passes — 125 existing tests
  still green; no coverage regression (nothing testable added).
- `npm run build` succeeds.
- `npm run serve` + headless-Chromium screenshots (the repo's established
  pattern):
  - **Mobile (~390px), Daily:** on load the game card (mode, kit-numbered clubs,
    input, "Guesses left") is fully visible; the drawer is **closed**; the pull
    tab is visible. (R1, R2)
  - **Mobile, after a wrong guess:** a new hint is revealed, the drawer stays
    closed, and the pull tab shows the **unseen-hint dot**; tapping the tab opens
    a **full-width** drawer and clears the dot; the close button dismisses it back
    to the visible card. (R3, R7)
  - **Mobile touch targets:** pull tab and close button hit areas ≥44×44px. (R8)
  - **Mobile keyboard:** Escape closes the open drawer; focus lands on the close
    button when opened and returns to the pull tab when closed. (R9)
  - **Desktop (~1000px), Daily/Practice:** drawer still auto-opens beside the
    card, content-height, unchanged. (R4)
  - **No horizontal overflow** from the full-width parked/off-screen drawer at
    ≤640px (check `document.documentElement.scrollWidth`). (KTD3)
  - Contrast/focus unchanged (spot-check pull tab + close button focus rings). (R6)

---

## Scope Boundaries

### Deferred to Follow-Up Work

- **Dismiss backdrop / tap-outside-to-close** on mobile — needs a backdrop
  element + handler; Escape-to-close (R9) covers the keyboard exit in the interim.
- **Full focus trap** while the overlay is open — R9/KTD5 move focus but do not
  trap it; a trap is a larger a11y pass.
- **True bottom-sheet** slide-from-below animation — full-width right-slide reuses
  the existing transform contract with less risk.
- **Live `resize`/orientation listener** — see KTD4; the transient
  crossing-while-open window is accepted for this fix.

### Out of scope

- Game logic, dataset, persistence, matching.
- The two other parked V4 ideas in the origin task (theme toggle, scoreboard
  layout restructure).

---

## Sources & Research

- Origin task: `tasks/20260702-091541/TASK.md` (problem, pointers, metajurassic
  reference link).
- Reference implementation: metajurassic `src/style.css` — full-width mobile
  drawer at `@media (max-width: 768px)` (adapted to 640px + auto-open gate here).
- Current code: `src/ui/panel.ts` (`renderPanel` auto-open block — note it only
  ever sets `open = true`; `applyOpenState`; `ensureWired`);
  `.hint-panel`/`.hint-panel-pull`/`.hint-panel__close` rules in `src/style.css`.
- Conventions: `AGENTS.md` (pure-logic vs DOM-only split, coverage exclusions,
  verify-by-running-the-app), `jest.config.js`, V4.6 (`tasks/20260702-082217`)
  for the contrast/focus bar. WCAG 2.5.5 for the 44px target (R8).

## Definition of Done

- [ ] U1: no auto-open at ≤640px; an already-open drawer is force-closed on a new
      hint (desktop→mobile handled at next render); unseen-hint `data-new` set
      while closed on mobile and cleared on open; Escape closes; focus moves to
      close on open and back to pull tab on close; state-machine contract intact.
- [ ] U2: opened drawer is full-width + scrollable at ≤640px; pull tab + close
      button ≥44×44px; `data-new` dot rendered; desktop unchanged; focus/contrast
      preserved; no horizontal overflow.
- [ ] `npm run ci` + `npm run build` pass.
- [ ] Mobile + desktop screenshots confirm R1–R9.
