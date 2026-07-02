---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-brainstorm
title: "UI/UX Polish: Two-Column Game Screen + Consistency Pass - Plan"
created: 2026-07-02
---

# UI/UX Polish: Two-Column Game Screen + Consistency Pass - Plan

> **Product Contract preservation:** unchanged from the `ce-brainstorm` output
> (R1–R6, actors, scope, assumptions, open questions below are verbatim). This
> enrichment adds only the Planning Contract (KTDs, Implementation Units,
> Verification Contract, Definition of Done).

## Goal Capsule

- **Objective:** Make Football Guessr feel professional and shippable by fixing
  weak type hierarchy, a cluttered/detached top-center composition (the hint
  drawer floats as a separate island beside the game card on desktop), and a
  mobile header collision — within the shipped pitch-green theme.
- **Product authority:** This document. Existing product shape (daily/practice
  football-club guessing game) is inherited.
- **Open blockers:** None. Ready for `ce-work`.

---

## Product Contract

### Problem Frame

The game is functional but reads as unfinished (confirmed by a visual audit):
1. **Weak hierarchy / small text** — everything is small quiet type; no confident
   large anchor, so every screen reads as "all captions." Profile's large gold
   stat numbers are the one place hierarchy works.
2. **Cluttered, detached composition** — the game card stacks five elements at
   similar weight; on desktop the hint drawer floats as a separate island with a
   gap, reading as two disconnected panels.
3. **Mobile header collision** — the title is clipped by the profile avatar on
   narrow screens.

"Too much blank space" was flagged minor; addressed as a side effect of the new
composition, not a standalone goal.

### Actors

- **A1 — Player** (desktop and mobile): plays Daily/Practice, reads revealed
  clubs (career path) and wrong guesses, checks Profile stats.

### Chosen Direction

Direction **B — two-column "matchday" layout**: wide screens present one
connected bordered unit (play column + always-visible hints column); narrow
screens collapse to single-column play + the on-demand full-width hint drawer.
Chosen because the core loop *accumulates* clubs and guesses that deserve
persistent, roomy, connected space.

### Requirements

- **R1 — Two-column game composition (wide).** Game screen (Daily + Practice) is
  one connected bordered unit: play column (mode, club hint(s), input+button,
  guesses-left/status) beside a hints column (career path, wrong guesses), both
  visible. No detached/floating drawer on wide screens.
- **R2 — Responsive collapse (narrow).** Below the breakpoint: single-column play
  + on-demand full-width hint drawer (pull tab, unseen-hint indicator). Gameplay
  visible on load; hints one tap away.
- **R3 — Type scale & hierarchy.** Club name and primary elements in confident
  large type; section labels quiet secondary. No screen reads as uniformly small.
- **R4 — Mobile header fix.** Header title never clipped by / overlapping the
  profile button on narrow screens.
- **R5 — Cross-surface consistency.** Game screen containment/hierarchy aligned
  to the Profile page; light spacing/type consistency across Profile, FAQ, and
  the win/loss modal — consistency, not re-layouts.
- **R6 — Preserve theme & accessibility.** Stay within the pitch-green theme;
  preserve WCAG AA contrast and visible, non-color-only focus states.

### Acceptance Signals

Wide view reads as one connected composition (no detached island) with room for
hints to grow; club/primary elements visually dominant; mobile title never
clipped + gameplay visible on load + hints via drawer; game/Profile/FAQ/modal
visually consistent; AA contrast + visible focus preserved.

### Scope Boundaries

**In scope:** recomposing the game screen (Daily + Practice, shared
`src/index.html`) into the two-column/responsive layout; type-scale/hierarchy
bump; mobile header fix; consistency pass across existing surfaces.

**Out of scope (non-goals):** new features/pages; dataset or crest art (V3,
`tasks/20260701-185929`); theme toggle or re-theme; re-layouts of Profile/FAQ
beyond consistency; blank space as a standalone goal; game logic/data/
persistence/matching changes (presentation only).

### Assumptions

- **A-1:** Builds on the mobile hint-drawer work (PR #1,
  `fix/mobile-hint-drawer-overlap`) as the mobile baseline; if unmerged when
  implementation starts, this work branches off it (see Planning Contract →
  Sequencing).
- **A-2:** On wide screens hints are **persistent** in the right column, so the
  drawer open/close contract becomes **narrow-screen-only**.
- **A-3:** Pitch-green CSS custom properties are the styling substrate; polish
  reuses them.
- **A-4:** Presentation-only; no `game.ts`/data/persistence change.

### Outstanding Questions

- **Q-1 (resolved in KTD1):** two-column→single-column breakpoint.
- **Q-2 (resolved in U5):** modal/FAQ depth = consistency touch-ups only.

---

## Planning Contract

### Key Technical Decisions

- **KTD1 — One `#hint-panel` element, CSS-reflowed at a single breakpoint.**
  Keep the existing `#hint-panel` (same content rendered by `src/ui/panel.ts`
  into `#hint-panel-clubs` / `#hint-panel-guesses`). Use **one** layout
  breakpoint `B` for the whole responsive switch, superseding PR #1's 640px:
  - **≥ B:** `.game-layout` is a connected two-column row; `.hint-panel` is
    overridden to in-flow (`position: static; transform: none; visibility:
    visible`) as the always-visible right column. **The override must fully
    neutralize the drawer, not just those three properties** (feasibility
    review):
    - **Beat `.active`'s transform.** `.hint-panel.active { transform:
      translate(0, -50%) }` lives outside the media query at higher specificity
      (0,2,0) and would re-shift the in-flow column up half its height on a
      desktop new-hint (which still sets `open=true` → `.active`). The ≥ B block
      must also reset `.hint-panel.active { transform: none }` (or use an
      equal/greater-specificity selector) so `.active` can't re-apply.
    - **Hide the close control too.** Hide `.hint-panel__close` alongside
      `.hint-panel-pull` at ≥ B — otherwise the always-visible column exposes a
      × that fires `closePanelManually()`, latching `manuallyClosed` and setting
      `aria-hidden="true"` on a CSS-forced-visible column (visible-but-AT-hidden
      desync).
    - **Reset drawer chrome** so the two columns read as one connected unit
      (R1): `box-shadow` (leftward drop → shadow seam), `border-right: none` +
      `border-radius: 12px 0 0 12px` (asymmetric border), `backdrop-filter`, and
      `max-height: 80vh`. Exact connected-unit border/radius tuned by eye.
  - **< B:** `.hint-panel` is the fixed on-demand full-width drawer (PR #1
    behavior) with the pull tab + state machine. **Rename the existing
    `@media (max-width: 640px)` block in `src/style.css` to breakpoint `B`** (it
    currently carries the mobile full-width drawer rules from PR #1).

  This resolves Q-1: `B ≈ 820px` (two columns need ~play 480 + hints ~300 +
  gaps; tunable during implementation by eye). `isNarrowViewport()` in
  `panel.ts` and the CSS `@media` **must share `B`** so behavior and layout
  switch together (extend the cross-reference-comment guard already used for the
  640px value). The state-machine exports
  (`openPanel`/`closePanel`/`closePanelManually`/`isPanelOpen`/`togglePanel`)
  are unchanged (A-2).
- **KTD2 — Type scale as CSS custom properties.** Add a small scale at `:root`
  (e.g. `--fs-club`, `--fs-primary`, `--fs-body`, `--fs-label`) and apply it, so
  hierarchy is tunable in one place and reused across surfaces (R3, R5). Club
  name / primary large; labels stay quiet secondary.
- **KTD3 — Header no-overlap via reserved space.** The profile button is
  `position: absolute; right: 20px`; the centered title can slide under it on
  narrow screens. Fix by giving the header horizontal padding / the title a
  `max-width` (or a flex layout that reserves the button's slot) so the title
  truncates or wraps instead of underlapping (R4).
- **KTD4 — Consistency via shared tokens.** Align the game card's containment
  and hierarchy to the Profile page's card pattern using the same spacing/type
  custom properties; the Profile/FAQ/modal touch-ups reuse those tokens rather
  than bespoke values (R5).

### Implementation Units

### U1. Two-column responsive game layout

- **Goal:** Recompose the game screen into a connected two-column unit on wide
  screens and a single-column + on-demand drawer below breakpoint `B`. (R1, R2, R6)
- **Requirements:** R1, R2, R6.
- **Dependencies:** none.
- **Files:** `src/style.css`; `src/index.html` (only if a layout wrapper element
  is needed around `.game` + `#hint-panel`).
- **Approach:** Per KTD1 — restyle `.game-layout` as a centered two-column row
  ≥ B (`.game` play column + `#hint-panel` hints column joined as one bordered
  unit, no gap/float); add the `@media (max-width: B)` block that returns
  `.hint-panel` to the fixed drawer and shows `.hint-panel-pull`. For ≥ B apply
  the **full** neutralization list in KTD1 (position/transform/visibility, **plus**
  resetting `.hint-panel.active` transform, hiding `.hint-panel__close`, and
  resetting the drawer chrome) — not just the first three, or the drawer leaks
  into the column. Rename the existing `@media (max-width: 640px)` drawer block
  to `B`. Keep `.active`/transform semantics for < B. Preserve the `#hint-panel*`
  id contract with `panel.ts`.
- **Patterns to follow:** existing `.game-layout`/`.hint-panel*` rules; the
  Profile page's card containment as the visual target.
- **Execution note:** presentation; verify by running the app at wide + narrow
  widths (screenshots), not unit tests.
- **Test scenarios:** `Test expectation: none — CSS/markup layout; verified by
  screenshots at wide (~1000px) and narrow (~390px) per the Verification
  Contract.`

### U2. Sync the drawer breakpoint + desktop no-op in panel.ts

- **Goal:** Make the drawer behavior (auto-open, force-close, data-new,
  focus/Escape) apply only below breakpoint `B`, matching U1's CSS. (R2, A-2)
- **Requirements:** R2.
- **Dependencies:** U1 (shared breakpoint `B`).
- **Files:** `src/ui/panel.ts`.
- **Approach:** Update `isNarrowViewport()`'s query from 640px to `B` and the
  cross-reference comment. The auto-open/force-close/`data-new`/focus logic
  already gates on `isNarrowViewport()`, so on desktop it becomes a no-op;
  confirm nothing hides the now-in-flow panel or steals focus on wide screens
  (the transition focus-move is already gated to narrow). No change to the
  exported state-machine functions.
- **Patterns to follow:** the existing `isNarrowViewport()` + auto-open block.
- **Execution note:** DOM module; verify by app run (desktop shows persistent
  hints with no toggle/focus-steal; mobile drawer intact).
- **Test scenarios:** `Test expectation: none — src/ui/** is DOM-only and
  coverage-excluded (jest.config.js); verified by running the app.`

### U3. Type scale & hierarchy

- **Goal:** Establish a confident type scale so the club name/primary elements
  dominate and the screen stops reading as all-captions. (R3)
- **Requirements:** R3, R6.
- **Dependencies:** none (composes with U1).
- **Files:** `src/style.css`.
- **Approach:** Per KTD2 — add scale custom properties at `:root`; enlarge the
  club name and primary elements; keep section labels quiet. Verify contrast at
  the new sizes/weights stays AA.
- **Patterns to follow:** Profile stat-value hierarchy (the working example);
  existing `:root` custom-property convention.
- **Test scenarios:** `Test expectation: none — CSS; verified by screenshots +
  contrast check (Verification Contract).`

### U4. Header title / profile-button no-overlap

- **Goal:** The header title is never clipped by or overlapping the profile
  button on narrow screens. (R4)
- **Requirements:** R4.
- **Dependencies:** none.
- **Files:** `src/style.css`; `src/index.html`/`src/_header.html` (only if markup
  must change to reserve the button slot).
- **Approach:** Per KTD3 — reserve horizontal space for the absolutely-positioned
  profile button (header padding / title `max-width` / flex slot) so the title
  truncates or wraps rather than underlapping. Applies to all pages sharing the
  header partial.
- **Test scenarios:** `Test expectation: none — CSS/markup; verified by
  screenshots at 320px / 390px / 480px (title uncollided).`

### U5. Cross-surface consistency pass

- **Goal:** Bring the game screen in line with the Profile page's containment/
  hierarchy and apply light consistency touch-ups to Profile, FAQ, and the
  win/loss modal. (R5)
- **Requirements:** R5, R6.
- **Dependencies:** U1, U3 (final composition + type scale must exist first).
- **Files:** `src/style.css`.
- **Approach:** Per KTD4 — reuse the spacing/type tokens across surfaces; align
  card treatment. Q-2: modal/FAQ get **touch-ups only** (spacing, type,
  containment consistency), not re-layouts.
- **Patterns to follow:** Profile card grid + section-title treatment.
- **Test scenarios:** `Test expectation: none — CSS; verified by screenshots of
  Daily, Practice, Profile, FAQ, and the win/loss modal reading consistently.`

### Verification Contract

Project convention (`AGENTS.md`, `jest.config.js`): `src/ui/**` and styling are
verified by running the app, not unit tests. Gates:

- `npm run ci` (format:check + lint + test:coverage, 125 tests) and `npm run
  build` pass — no logic change, no coverage regression.
- `npm run serve` + headless-Chromium screenshots:
  - **Wide (~1000px), Daily & Practice:** one connected two-column composition;
    hints always visible in the right column; no detached island. (R1)
  - **Narrow (~390px), Daily & Practice:** single-column; gameplay visible on
    load; hints via the on-demand drawer; title uncollided. (R2, R4)
  - **Type hierarchy:** club name / primary visually dominant across widths. (R3)
  - **Consistency:** Daily/Practice/Profile/FAQ/win-loss modal read consistently.
    (R5)
  - **A11y:** AA contrast at new sizes; visible focus states; no horizontal
    overflow at any width. (R6)
- `#hint-panel*` id contract intact between `src/index.html` and
  `src/ui/panel.ts`.

### Sequencing

Builds on PR #1 (`fix/mobile-hint-drawer-overlap`) as the mobile baseline —
**branch this work off that branch** (not `master`), since both restructure the
same `src/index.html` + `.hint-panel*` CSS. If PR #1 is already merged, branch
off `master`.

### Definition of Done

- [ ] U1: wide = connected two-column, hints persistent; narrow = single-column
      + on-demand drawer; one shared breakpoint `B`.
- [ ] U2: drawer logic narrow-only; desktop no toggle/focus-steal; state-machine
      exports unchanged.
- [ ] U3: type scale in place; club/primary dominant; AA preserved.
- [ ] U4: header title never clipped 320–480px.
- [ ] U5: game aligned to Profile; Profile/FAQ/modal consistent (touch-ups only).
- [ ] `npm run ci` + `npm run build` pass; screenshots confirm R1–R6.

---

## Sources & Research

- Origin: this file's Product Contract (from `ce-brainstorm`), + the session
  visual audit of Daily (desktop+mobile) and Profile.
- Code: `src/style.css` (`.game-layout`/`.game`/`.hint-panel*`/header),
  `src/ui/panel.ts` (`isNarrowViewport`, auto-open block, state machine),
  `src/index.html` / `src/_header.html`, Profile page as the consistency target.
- Related in-flight: PR #1 `fix/mobile-hint-drawer-overlap` (mobile drawer);
  V4 pitch-green theme on `master`. Deferred: `tasks/20260701-185929` (V3 art).
