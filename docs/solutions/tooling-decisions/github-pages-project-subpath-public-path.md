---
title: Deploying to a GitHub Pages project site requires PUBLIC_PATH for the subpath
date: 2026-07-02
category: docs/solutions/tooling-decisions/
module: deployment / github-pages
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - Deploying this webpack multi-page build to a GitHub Pages project site
  - Adding or changing the GitHub Actions deploy workflow
  - Debugging broken asset URLs or dead Daily/Practice/Profile/FAQ links on the deployed site
tags: [github-pages, deployment, webpack, public-path, base-path, github-actions]
---

# Deploying to a GitHub Pages project site requires PUBLIC_PATH for the subpath

## Context

GitHub Pages serves a **project** site (as opposed to a user/org site) from a
subpath named after the repo: `https://<user>.github.io/<repo>/`, i.e.
`https://alexjercan.github.io/football-guessr/`. A build that assumes it is
served from the domain root (`/`) emits absolute asset URLs like `/index.js` and
absolute inter-page links like `/practice`, which resolve to
`https://alexjercan.github.io/index.js` and `.../practice` — one level above the
subpath — so on the deployed site the CSS/JS 404 and the
Daily/Practice/Profile/FAQ links break, even though everything works locally at
`localhost:8080/`.

## Guidance

Build for deploy with the repo subpath in `PUBLIC_PATH`:

```bash
PUBLIC_PATH=/football-guessr/ npm run build
```

`webpack.config.js` already reads that env var (defaulting to `/`) and threads it
into **both** `output.publicPath` (asset URLs) and every page's `basePath`
(inter-page links, via `HtmlWebpackPlugin` options consumed in the HTML
templates). So the single env var fixes both classes of URL — no other config
change is needed. Only the deploy build sets it; local dev and the CI test gate
leave it at the `/` default.

In the GitHub Actions deploy workflow the build step is simply:

```yaml
- name: Build for GitHub Pages
  run: PUBLIC_PATH=/football-guessr/ npm run build
```

## Why This Matters

The failure is silent in the worst way: every local check passes (dev server and
`npm run build` both serve from `/`), CI is green, the deploy job succeeds, and
the breakage only appears on the live site. Wiring the subpath through
`publicPath` **and** `basePath` matters because they cover different URLs —
fixing only `publicPath` leaves the inter-page navigation links broken, and vice
versa. Because the value is the literal repo name, a repo rename (or moving to a
custom domain, where it becomes `/`) requires updating it.

## When to Apply

- Any GitHub Actions deploy of this app to Pages.
- Reproducing a deploy build locally to debug asset/link paths — use the same
  `PUBLIC_PATH=/football-guessr/ npm run build`.
- Adapting this pattern to another project: the value is always
  `/<repo-name>/` for a project Pages site, `/` for a user/org site or a custom
  domain.

## Examples

Wrong (defaults to root) vs right (subpath) — deployed under
`alexjercan.github.io/football-guessr/`:

```
# PUBLIC_PATH unset  -> <script src="/index.js">      -> 404 (resolves to /index.js)
#                       <a href="/practice">          -> 404
# PUBLIC_PATH=/football-guessr/
#                    -> <script src="/football-guessr/index.js">  -> OK
#                       <a href="/football-guessr/practice">      -> OK
```

Deep links need no SPA `404.html` fallback here: the multi-page
`HtmlWebpackPlugin` build emits real `practice/index.html`, `profile/index.html`,
and `faq/index.html`, so each route is a static file Pages serves directly.

## Related

- Deploy workflow: `.github/workflows/deploy.yml`; base-path wiring:
  `webpack.config.js` (`PUBLIC_PATH` -> `output.publicPath` + per-page
  `basePath`).
- Plan: `docs/plans/2026-07-02-002-feat-github-actions-ci-cd-plan.md`
  (origin task `tasks/20260702-095716`).
- Manual prerequisite: GitHub → Settings → Pages → Source = **GitHub Actions**
  must be set before the first deploy can succeed.
