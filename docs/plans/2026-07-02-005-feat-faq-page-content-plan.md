---
title: "feat: FAQ page explaining how the game works"
date: 2026-07-02
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-plan-bootstrap
origin: tasks/20260702-145629/TASK.md
plan_type: feat
depth: lightweight
---

# feat: FAQ page explaining how the game works

## Summary

The FAQ page already exists and is routed (`/faq`, linked from the footer) but its
`<main>` is **empty** — `src/faq.html` renders only the shared header/footer. This
change fills it with static content that explains how Football Guessr works: the
goal, how to play, the 25-guess limit, the career-path hint reveal, the Daily vs
Practice modes, guess matching, sharing, and stats. It is a **presentation-only**
change — static markup in `src/faq.html` plus themed CSS in `src/style.css`. No
game logic, data, or JavaScript behavior changes; `src/faq.ts` stays as-is (it only
imports the stylesheet).

---

## Problem Frame

The footer links "FAQ" on every page, and the win/lose modal and onboarding assume
players understand the rules — but the FAQ page is a blank shell. New players have
nowhere to learn the mechanics (what the growing club list means, how many guesses
they get, how Daily differs from Practice). The content must be **accurate to the
current implementation** and match the shipped pitch-green theme and the existing
content-page pattern (`src/profile.html`).

---

## Requirements

- **R1 — Populate the FAQ page.** `src/faq.html`'s `<main>` gains readable,
  accurate content explaining how the game works. (origin: TASK.md)
- **R2 — Accurate rules.** Content reflects the real mechanics: guess the mystery
  footballer from their clubs; the career path starts with one club and reveals the
  next club on each wrong guess; **25 guesses** (`MAX_GUESSES` in `src/game.ts`);
  win by naming the player, lose after 25 wrong guesses. (source: `src/game.ts`)
- **R3 — Explain both modes.** Daily (one date-seeded puzzle everyone shares,
  numbered like Wordle, saves and resumes mid-game) vs Practice (random player,
  unlimited, not resumed, recorded only when finished). (source: AGENTS.md Domain
  Notes; `src/index.ts`/`src/practice.ts`)
- **R4 — Cover the supporting features** players will ask about: accent-insensitive
  name matching, the emoji-grid share (`Daily #N — X/25`, 🟥/🟩), and the profile
  stats page. (source: `src/matching.ts`, `src/share.ts`, `src/profile.ts`)
- **R5 — On-theme and responsive.** Styled with the pitch-green CSS custom
  properties at `:root`, consistent with the Profile page container/heading
  pattern; readable and non-overflowing at mobile and desktop widths. (constraint:
  AGENTS.md coding conventions)
- **R6 — No logic/behavior change.** No changes to game logic, data, storage, or
  `faq.ts` behavior; the page is static. (constraint)

---

## Key Technical Decisions

### KTD1 — Static HTML in the existing template, no JS
Author the FAQ as static markup inside `src/faq.html`'s `<main>`. The page is built
by `HtmlWebpackPlugin` (template `src/faq.html` → `faq/index.html`, chunk `faq`) with
the shared `#header`/`#footer` partials injected at build time by `webpack-partials`.
No runtime rendering is needed, so `src/faq.ts` stays exactly as-is (`import
"./style.css";`). Rationale: the content is fixed prose; adding JS/data would be
gratuitous and would pull DOM logic into a page that needs none. Mirrors how
`src/profile.html` places its content directly in `<main>`.

### KTD2 — Theme via existing CSS custom properties; new `faq-*` classes
Add a small set of `.faq-*` rules to `src/style.css` (container, title, section
heading, question/answer blocks) using the existing `:root` custom properties
(`--pitch-green`, `--chalk`, `--glass-bg`, `--fs-heading`, `--fs-label`, etc.).
Reuse the Profile page's container/title conventions (`.profile-container` /
`.profile-title`) as the visual reference so the FAQ feels like part of the app.
Rationale: AGENTS.md requires theming through custom properties, not hardcoded
colors; matching the Profile page keeps cross-surface consistency (the same goal as
the recent two-column polish).

### KTD3 — Content grounded in code, not invented
Every rule stated in the FAQ is verified against the implementation before writing:
guess count from `MAX_GUESSES`, reveal behavior from the `createInitialState` /
reducer logic in `src/game.ts`, mode differences from the loaders and AGENTS.md,
share format from `src/share.ts`. Rationale: an FAQ that contradicts the game is
worse than none; the tag is `docs` but the accuracy bar is a feature bar.

---

## Implementation Units

### U1. Author the FAQ content in `src/faq.html`

**Goal:** Replace the empty `<main></main>` in `src/faq.html` with structured,
accurate FAQ content explaining how the game works.
**Requirements:** R1, R2, R3, R4, R6.
**Dependencies:** none.
**Files:** `src/faq.html`.
**Approach:** Put the content in `<main>` inside a container element (e.g.
`<div class="faq-container">` with an `<h1 class="faq-title">`), mirroring
`src/profile.html`'s structure. Organize as short Q&A / titled sections covering:
- **What is Football Guessr?** — guess the mystery footballer from the clubs they
  played for.
- **How do I play?** — the career path starts with the player's first club; type a
  footballer's name and submit a guess; each wrong guess reveals the **next** club
  in their career; you have **25 guesses**; you win by naming the player and lose
  after 25 wrong guesses.
- **Daily vs Practice** — Daily is one puzzle per day, the same for everyone,
  numbered (like Wordle), and it saves so you can resume mid-game; Practice gives a
  new random player any time, isn't resumed, and records a result only when the game
  ends.
- **Hints / the career path** — clubs appear in career order; the newest reveal is
  flagged; wrong guesses are listed so you don't repeat them.
- **Guessing** — name matching is accent- and case-insensitive and tolerant of
  minor spelling differences.
- **Sharing** — after a game you can share a spoiler-free emoji grid with your score
  (e.g. `Daily #N — 4/25`, 🟥 for wrong, 🟩 for the winning guess).
- **Stats** — the profile button (top-right) tracks your win rate, streaks, and
  guess distribution per mode.
Keep copy concise and skimmable; use semantic headings (`<h2>`/`<h3>`) and lists.
Do not restate exact internal identifiers; state player-facing behavior. Verify each
claim against `src/game.ts` (`MAX_GUESSES`, reveal logic), AGENTS.md (mode
behavior), `src/matching.ts`, and `src/share.ts` before finalizing wording.
**Patterns to follow:** `src/profile.html` (container in `<main>`, heading classes);
the footer/header partial contract (leave `#header`/`#footer` divs untouched).
**Test scenarios:** `Test expectation: none -- static content page; src/*.html and
page entry points are coverage-excluded by design (jest.config.js). Verified by
running the app and reading the rendered page.`
**Verification:** `npm run serve` → visit `/faq`; the page shows the header, the FAQ
content in `<main>`, and the footer; every stated rule matches the game (25 guesses,
club-per-wrong-guess reveal, Daily/Practice behavior); no console errors.

### U2. Style the FAQ page in `src/style.css`

**Goal:** Make the FAQ readable, on-theme, and responsive.
**Requirements:** R5, R6.
**Dependencies:** U1 (styles target U1's markup classes).
**Files:** `src/style.css`.
**Approach:** Add `.faq-*` rules using the existing `:root` custom properties — a
centered, max-width container (consistent with `.profile-container`), a page title
using the heading type scale, section headings in the quiet-label / pitch-green
style, and comfortable line-height/spacing for prose and lists. Ensure it reflows
without overflow at narrow widths (reuse the responsive approach already in
`style.css`; no fixed widths that break mobile — cf. the box-sizing learning in
`docs/solutions/ui-bugs/`). Do not hardcode colors; do not alter unrelated rules.
**Patterns to follow:** `.profile-container` / `.profile-title` and the `:root` type
scale in `src/style.css`; the dark pitch-green theme.
**Test scenarios:** `Test expectation: none -- CSS/presentation; verified visually,
not unit-tested (DOM layer is coverage-excluded).`
**Verification:** `npm run serve` + headless-Chromium screenshots at desktop (~900px)
and mobile (~400px) widths: FAQ is legible, matches the theme, and text neither
overflows nor overlaps at either width.

---

## Verification Contract

- `npm run ci` passes (format:check + lint + test:coverage) — no logic changed, so
  the existing 140 tests remain green; coverage thresholds are unaffected (the FAQ
  page and `.html`/CSS are outside the coverage set).
- `npm run build` succeeds and emits `faq/index.html` with the new content.
- Manual (the established DOM-verification path here): `npm run serve` → `/faq`
  renders header + FAQ content + footer; screenshots at mobile and desktop widths
  show on-theme, non-overflowing, readable content; footer "FAQ" link reaches it.
- Content accuracy: each rule cross-checks against `src/game.ts` (`MAX_GUESSES` = 25,
  reveal-on-wrong-guess), AGENTS.md (Daily/Practice), `src/share.ts` (share format).

## Definition of Done

R1–R6 satisfied: `/faq` presents accurate, on-theme, responsive content explaining
the goal, how to play, the 25-guess limit, the career-path reveal, Daily vs Practice,
matching, sharing, and stats; no game logic/data/behavior changed; `npm run ci`
green and the page verified in the running app at mobile and desktop widths.

---

## Scope Boundaries

**In scope:** static FAQ content in `src/faq.html`; themed, responsive CSS in
`src/style.css`.

**Out of scope:** any interactivity (accordions, search, anchor navigation); changes
to game logic, data, storage, or `faq.ts` behavior; a first-run/onboarding tutorial
or in-game help overlay; rewording the win/lose modal; new routes or nav changes.

### Deferred to Follow-Up Work

- Interactive niceties (collapsible sections, in-page anchor links) if the content
  grows long enough to warrant them.
- Linking the FAQ from the win/lose modal or a first-play hint, if onboarding needs
  strengthening later.

---

## Risks & Dependencies

- **Content drift (low).** The FAQ can fall out of sync if game rules change later
  (e.g. `MAX_GUESSES`). Mitigated by grounding every claim in code now and phrasing
  behavior rather than restating magic numbers where natural. Low severity — a docs
  page, not a runtime dependency.
- **Theme/responsive regressions (low).** New CSS could overflow on mobile; mitigated
  by reusing the existing container/responsive patterns and verifying with
  mobile-width screenshots (per AGENTS.md's run-the-app verification norm).
- **No test dependency:** `src/*.html` and page entry points are coverage-excluded by
  design, so this change is verified by running the app, not by unit tests.

---

## Sources & Research

- Origin task: `tasks/20260702-145629/TASK.md`.
- Codebase grounding: `src/faq.html` (empty `<main>`), `src/faq.ts` (`import
  "./style.css"` only), `webpack.config.js` (FAQ page + partials wiring),
  `src/_header.html`/`src/_footer.html` (injected partials), `src/profile.html`
  (content-page pattern to mirror), `src/game.ts` (`MAX_GUESSES` = 25, reveal
  logic), `src/share.ts` (share format), `src/matching.ts` (accent-insensitive
  matching), AGENTS.md (Daily vs Practice domain notes, theming/verification
  conventions).
- No external research required — purely internal content + styling.
