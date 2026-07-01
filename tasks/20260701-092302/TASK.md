# V1 Step 2 — Webpack Build Configuration

- STATUS: CLOSED
- PRIORITY: 55
- TAGS: build,webpack

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 2.

**Goal:** Be able to build the TypeScript source + serve/bundle the HTML page.

**Checklist:**
- [x] Install webpack, webpack-cli, ts-loader, webpack-dev-server
- [x] Install `html-webpack-plugin`
- [x] Create `webpack.config.js` (entry `src/index.ts`, output to `dist/`, `.ts` via ts-loader, HtmlWebpackPlugin)
- [x] Add npm scripts: `build` (bundle) and `serve` (dev server with live reload)
- [x] Verify a TypeScript file builds and renders in the browser

**Current status (CLOSED):** Build config is complete and exceeds V1 needs — it is multi-page (index/practice/faq/profile), adds css/postcss/tailwind loaders, `copy-webpack-plugin` for `src/data`, a custom HtmlPartials plugin, and a dev server on port 8080. Note: the dev script is named `serve` (not `start`/`dev`).

