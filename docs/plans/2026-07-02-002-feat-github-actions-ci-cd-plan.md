---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: ce-plan-bootstrap
title: "feat: GitHub Actions CI (format+lint+test) and GitHub Pages deploy"
created: 2026-07-02
origin: tasks/20260702-095716/TASK.md
---

# feat: GitHub Actions CI (format+lint+test) and GitHub Pages deploy

## Summary

Add two GitHub Actions workflows: **CI** runs the existing `npm run ci` gate
(format:check + lint + test:coverage) on pull requests and pushes, and **CD**
builds the static site and deploys it to **GitHub Pages** on push to `master`.
The repo (`github.com/alexjercan/football-guessr`, default branch `master`) is a
static client-side TS/Webpack app with no backend. The one non-obvious
constraint is the **Pages base path**: it's a project site served from the
`/football-guessr/` subpath, and `webpack.config.js` already threads a
`PUBLIC_PATH` env var into `output.publicPath` and every page's `basePath`, so
the deploy build must set `PUBLIC_PATH=/football-guessr/` or assets and
inter-page links break.

Depth: **Standard**. Three implementation units (CI, CD, docs). No app-code
change.

## Assumptions

- Node **20 LTS** in CI (nothing in the repo pins a version; `flake.nix` uses a
  bare `pkgs.nodejs`). Tunable — a single `node-version` value in both workflows.
- Deploy triggers on **push to `master`** (post-merge). Optional
  `workflow_dispatch` is added for manual re-runs.
- The manual repo settings (Pages source = GitHub Actions; `master` branch
  protection requiring the CI check) are done by a human in the GitHub UI — a
  workflow cannot set them. Documented, not automated.

---

## Problem Frame

- **Where:** new files under `.github/workflows/`; a `README.md` doc update.
  No changes to `src/`, `webpack.config.js`, or `package.json` — the build seam
  (`PUBLIC_PATH`) already exists.
- **Current state:** no `.github/workflows/` directory exists; nothing runs CI,
  and there is no deploy. `dist/` is already gitignored (0 tracked files), so CI
  building it needs no cleanup.
- **Why it matters:** `master` merges today are unverified (the mobile-drawer PR
  #1 has no checks), and there is no published site.

---

## Requirements

- **R1** — A CI workflow runs `npm run ci` on `pull_request` and on `push`
  (at least to `master`); the job is named so it can be made a required check.
- **R2** — CI uses `npm ci` (not `npm install`) on a pinned Node version with npm
  caching.
- **R3** — A deploy workflow publishes the built site to GitHub Pages on push to
  `master`, using the official Pages flow (`actions/configure-pages`,
  `actions/upload-pages-artifact` with `path: dist`, `actions/deploy-pages`) with
  `permissions: pages: write, id-token: write` and a `concurrency` group.
- **R4** — The deploy build runs `PUBLIC_PATH=/football-guessr/ npm run build`
  so assets and Daily/Practice/Profile/FAQ links resolve under the subpath.
- **R5** — The deployed site loads with working assets and working inter-page
  links at `https://alexjercan.github.io/football-guessr/`.
- **R6** — The manual repo settings (Pages source = GitHub Actions; `master`
  branch protection requiring the CI check) are documented for a human to apply.

Non-goals: no custom domain/CNAME; no SPA `404.html` fallback (the build already
emits `practice/index.html`, `profile/index.html`, `faq/index.html`, so deep
links resolve on static Pages); no app-code change.

---

## Key Technical Decisions

- **KTD1 — Two separate workflows, not one.** CI (`ci.yml`) gates correctness on
  every PR/push; deploy (`deploy.yml`) ships on `master`. Separating them keeps
  the required-check surface (CI) independent of the deploy job and lets the
  deploy gate itself on a green build without entangling PR feedback.
- **KTD2 — `PUBLIC_PATH=/football-guessr/` only in the deploy build.** The
  repo-name subpath is the Pages project-site convention. CI's `npm run ci` never
  builds for deploy, so the env var lives solely in the deploy workflow's build
  step. Hardcode the literal `/football-guessr/` (matches the repo name); a
  future custom domain would change it to `/`.
- **KTD3 — Official GitHub Pages Actions flow.** `configure-pages` →
  `upload-pages-artifact` (`path: dist`, matching `output.path`) → `deploy-pages`,
  with `pages: write` + `id-token: write` and a `concurrency: { group: pages }`
  so overlapping `master` pushes don't clash. This is the current
  GitHub-recommended pattern and needs no `gh-pages` branch or token.
- **KTD4 — Deploy depends on a green build; gate in-workflow.** Rather than
  cross-workflow coupling, the deploy workflow's build job runs the same
  lint/test gate (or a `needs:` build→deploy split) so a red `master` never
  ships. Simplest: a `build` job that runs `npm ci && npm run ci && PUBLIC_PATH=…
  npm run build` and uploads the artifact, then a `deploy` job `needs: build`.

---

## Implementation Units

### U1. CI workflow — test + lint on PR and push

- **Goal:** Run the existing quality gate on every PR and push so `master` can
  require it. (R1, R2)
- **Requirements:** R1, R2.
- **Dependencies:** none.
- **Files:** `.github/workflows/ci.yml` (new).
- **Approach:** Trigger on `pull_request` and `push`. Single `ci` job on
  `ubuntu-latest`: `actions/checkout` → `actions/setup-node` (pin `node-version`,
  `cache: npm`) → `npm ci` → `npm run ci`. Keep the job id/name stable (e.g.
  `ci`) so it can be selected as a required status check (R1). Optionally upload
  `test-results/junit.xml` (jest-junit already emits it) as an artifact.
- **Patterns to follow:** `package.json` `ci` script
  (`format:check && lint && test:coverage`) is the single gate — call it, don't
  re-list the sub-steps.
- **Execution note:** CI/config; verify by pushing the branch and reading the
  Actions run, not by unit tests.
- **Test scenarios:** `Test expectation: none — CI YAML config; verified by the
  workflow running green on this PR (and red when a lint/test failure is
  intentionally introduced, then reverted).`

### U2. Deploy workflow — build with base path + publish to Pages

- **Goal:** Build the site with the correct base path and deploy it to GitHub
  Pages on push to `master`. (R3, R4, R5)
- **Requirements:** R3, R4, R5.
- **Dependencies:** none (independent of U1; may reuse the same Node/setup
  pattern).
- **Files:** `.github/workflows/deploy.yml` (new).
- **Approach:** Trigger on `push` to `master` (+ `workflow_dispatch`).
  `permissions: { contents: read, pages: write, id-token: write }`;
  `concurrency: { group: "pages", cancel-in-progress: false }`. A `build` job:
  checkout → setup-node (pinned, `cache: npm`) → `npm ci` →
  `PUBLIC_PATH=/football-guessr/ npm run build` → `actions/configure-pages` →
  `actions/upload-pages-artifact` with `path: dist`. A `deploy` job
  `needs: build`, `environment: github-pages`, running `actions/deploy-pages`.
  The build job runs `npm run ci` **before** the build (KTD4) so a red `master`
  never ships even if branch protection is not (yet) enabled. (Dependencies is
  "none" because this is workflow-file-independent of U1 — the deploy workflow
  runs its own gate rather than depending on U1's CI workflow.)
- **Patterns to follow:** `webpack.config.js` `PUBLIC_PATH`/`publicPath`/
  `basePath` wiring (already present — this unit only sets the env var);
  `output.path = dist` → the artifact `path: dist`.
- **Execution note:** CI/config + deploy; the real proof is the post-deploy live
  site — verify assets and inter-page links load under `/football-guessr/`.
- **Test scenarios:** `Test expectation: none — deploy YAML config; verified by
  the Actions deploy succeeding and the live site at
  https://alexjercan.github.io/football-guessr/ loading with working assets and
  working Daily/Practice/Profile/FAQ links (R5).`

### U3. Document CI/deploy + manual repo settings

- **Goal:** Record how CI/deploy work and the one-time manual GitHub settings a
  human must apply. (R6)
- **Requirements:** R6.
- **Dependencies:** U1, U2 (document what they established).
- **Files:** `README.md` (modify).
- **Approach:** Add a short "CI / Deployment" section: CI runs `npm run ci` on
  PRs; `master` auto-deploys to GitHub Pages at the `/football-guessr/` URL.
  List the **manual** steps that cannot be scripted: Settings → Pages → Source =
  **GitHub Actions**; Settings → Branches → protect `master` requiring the `ci`
  check. Note the `PUBLIC_PATH` requirement for anyone building for deploy
  locally.
- **Patterns to follow:** existing `README.md` section style (Tech stack /
  Getting started).
- **Test scenarios:** `Test expectation: none — docs only.`

---

## Verification Contract

- **U1/U2 are CI/CD config** — verified by the workflows *running on GitHub*, not
  by local unit tests (nothing testable added; `npm run ci` locally still passes
  unchanged).
- Push the branch / open the PR and confirm the **CI** workflow runs and goes
  green; confirm it fails when a lint/test error is introduced (sanity), then
  revert.
- After merge to `master` (or a `workflow_dispatch`), confirm the **deploy**
  workflow succeeds and the **live site** at
  `https://alexjercan.github.io/football-guessr/` loads with working assets and
  working Daily/Practice/Profile/FAQ links (R4/R5) — the base-path proof.
- YAML sanity: workflows parse (no schema errors in the Actions UI); action
  versions pinned.

---

## Scope Boundaries

### Deferred to Follow-Up Work

- Preview deploys for PRs; deploy status/badge in README.
- Caching the webpack build across runs beyond npm cache.

### Out of scope

- Custom domain / CNAME (would flip `PUBLIC_PATH` to `/`).
- SPA `404.html` fallback — unnecessary; the multi-page build emits real
  `*/index.html` for each route.
- App code, dataset, styles. Gitignoring `dist/` — already done.
- Applying the GitHub repo settings themselves (manual; can't be done from a
  workflow) — only documented (U3).

---

## Sources & Research

- Origin task: `tasks/20260702-095716/TASK.md` (requirements, the `PUBLIC_PATH`
  subpath gotcha, options, manual-settings note).
- Repo facts: `webpack.config.js` (`PUBLIC_PATH` → `output.publicPath` +
  per-page `basePath`; `output.path = dist`); `package.json` `ci` script;
  `dist/` already gitignored; multi-page `HtmlWebpackPlugin` emits
  `practice/index.html`, `profile/index.html`, `faq/index.html`.
- Pattern: GitHub's official Pages-via-Actions flow (`configure-pages`,
  `upload-pages-artifact`, `deploy-pages`) — settled, no external research.

## Definition of Done

- [ ] U1: `.github/workflows/ci.yml` runs `npm run ci` on PR + push; stable job
      name for required-check selection.
- [ ] U2: `.github/workflows/deploy.yml` builds with
      `PUBLIC_PATH=/football-guessr/` and deploys `dist/` to Pages on `master`
      via the official flow with correct permissions + concurrency.
- [ ] U3: `README.md` documents CI/deploy + the manual Pages-source and
      branch-protection settings.
- [ ] CI workflow runs green; deploy succeeds; live site loads correctly under
      `/football-guessr/` (verified post-merge / on `workflow_dispatch`).
