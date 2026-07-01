# V1 Step 1 — Initialize Repository

- STATUS: CLOSED
- PRIORITY: 60
- TAGS: setup,scaffolding

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 1.

**Goal:** Basic project scaffolding, ready for TypeScript + Webpack development.

**Checklist:**
- [x] `git init` (repo is under git)
- [x] `npm init` (`package.json` present)
- [x] Add `.gitignore` (node_modules, dist, coverage, etc.)
- [x] Install TypeScript tooling (ts-loader, ts-node, ts-jest, typescript-eslint)
- [x] Add `tsconfig.json` (target ES2020, moduleResolution "bundler", resolveJsonModule)
- [x] Set up folder structure (`src/`, `src/data/`, `src/index.ts`)

**Current status (CLOSED):** Scaffolding is functional and the project builds. Notes for later: `tsconfig.json` does NOT enable strict mode (`noImplicitAny: false`, no `"strict": true`) — consider tightening. No `src/game/` directory yet; the core-logic module will be added in Step 4.

