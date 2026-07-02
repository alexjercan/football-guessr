# CI/CD — GitHub Actions: test+lint on PR, deploy to GitHub Pages

- STATUS: CLOSED
- PRIORITY: 90
- TAGS: ci,cd,deploy,github-actions

## Goal

Add GitHub Actions so that:

1. **CI** — every push and pull request runs the existing gate (`npm run ci` =
   `format:check` + `lint` + `test:coverage`). `master` should be protected by
   this check.
2. **CD** — pushing to `master` builds the site and deploys `dist/` to
   **GitHub Pages**.

Repo: `git@github.com:alexjercan/football-guessr.git` (default branch `master`).

## Key constraint: the Pages base path

This is a **project** Pages site, served from a subpath
(`https://alexjercan.github.io/football-guessr/`), not a domain root. The app
already supports this: `webpack.config.js` reads `PUBLIC_PATH` (defaults to `/`)
and threads it into both `output.publicPath` and every page's `basePath` (used
for inter-page links like the Practice href). So the deploy build must set it:

```bash
PUBLIC_PATH=/football-guessr/ npm run build
```

Get this wrong and the deployed site loads with broken asset URLs and broken
Daily<->Practice<->Profile links. Verify links resolve under the subpath after
first deploy.

## Plan

### 1. CI workflow — `.github/workflows/ci.yml`
- Triggers: `pull_request` and `push` (at least to `master`).
- Steps: checkout → `actions/setup-node` (pin a Node version, e.g. 20 LTS; enable
  npm cache) → `npm ci` → `npm run ci`.
- Optional: upload `test-results/junit.xml` (jest-junit already emits it) and/or
  the `coverage/` report as artifacts.

### 2. Deploy workflow — `.github/workflows/deploy.yml`
- Trigger: `push` to `master` (consider `workflow_dispatch` too for manual runs).
- Use the official Pages flow: `actions/configure-pages`,
  `actions/upload-pages-artifact` (path: `dist`), `actions/deploy-pages`.
- Permissions: `pages: write`, `id-token: write`; `concurrency` group so
  overlapping deploys don't clash.
- Build step: `npm ci` then `PUBLIC_PATH=/football-guessr/ npm run build`.
- Decide whether deploy should depend on CI passing (reuse the check / gate the
  job) so a red build never ships.

### 3. Repo settings (manual, document in the task on completion)
- GitHub → Settings → Pages → Source = **GitHub Actions**.
- Branch protection on `master`: require the CI status check to pass before
  merge (matches the "PRs only" rule in `AGENTS.md`).

## Open questions

- **Node version to pin?** (suggest 20 LTS unless the Nix flake pins otherwise —
  `flake.nix` currently just uses `pkgs.nodejs`.)
- **SPA routing / 404s:** the app uses clean paths (`/practice`, `/profile`) via
  webpack-dev-server `historyApiFallback` locally. GitHub Pages is static and has
  no rewrite layer — confirm the built `dist/` actually emits
  `practice/index.html`, `profile/index.html`, `faq/index.html` (it does per
  `HtmlWebpackPlugin` filenames), so direct links resolve without a SPA fallback.
  If any deep link 404s, add a `404.html` copy strategy.
- **Custom domain / CNAME?** None assumed; if one is added later, `PUBLIC_PATH`
  becomes `/` and the base-path concern goes away.

## Acceptance

- [ ] CI workflow runs `npm run ci` on PRs and push; visible as a required check
- [ ] Deploy workflow publishes `dist/` (built with `PUBLIC_PATH=/football-guessr/`)
      to GitHub Pages on `master`
- [ ] Live site loads with working assets and working Daily/Practice/Profile/FAQ
      links under the `/football-guessr/` subpath
- [ ] Pages source set to "GitHub Actions" and `master` branch protection enabled
      (repo-settings step recorded here when done)

## Notes

- `dist/` is currently committed/tracked in the repo; with CI building it, the
  built output no longer needs to be committed — consider gitignoring `dist/`
  as part of this work (out of strict scope, but related).
