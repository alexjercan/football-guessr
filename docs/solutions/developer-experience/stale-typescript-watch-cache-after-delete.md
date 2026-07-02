---
title: "Phantom TS compile error for a deleted file — stale watch/TS-server module graph"
date: 2026-07-02
category: developer-experience
module: build-tooling
problem_type: developer_experience
component: tooling
severity: low
related_components:
  - development_workflow
applies_when:
  - "A TypeScript compile error blames a file that was deleted from disk and git"
  - "The error references a symbol/import that was removed in the same refactor"
  - "The working tree is clean and a fresh build (rm -rf dist && npm run build) passes"
  - "grep finds no remaining references to the offending file or symbol"
  - "A long-running webpack serve / tsc --watch or the editor TypeScript language server is active"
root_cause: config_error
resolution_type: environment_setup
tags: [typescript, webpack, ts-loader, watch-mode, ts-server, stale-cache, phantom-error, developer-experience]
---

# Phantom TS compile error for a deleted file — stale watch/TS-server module graph

## Context

During a refactor in this webpack + ts-loader TypeScript project, `src/dataGen.ts`
was deleted and the exported type `RawPlayerEntry` was removed from `src/types.ts`
in the same change (a data generator was collapsed into a single hand-authored
data file). Immediately afterward, the build surfaced this error:

```
ERROR in src/dataGen.ts 1:23-37
[tsl] ERROR in src/dataGen.ts(1,24)
      TS2724: '"./types"' has no exported member named 'RawPlayerEntry'. Did you mean 'PlayerEntry'?
```

The error is self-contradictory: it blames a file that was **deleted**
(`src/dataGen.ts`) for importing a symbol that was **removed** (`RawPlayerEntry`).
That exact file-plus-symbol pairing no longer exists anywhere in the repo — which
is a physical impossibility if the error reflected the actual on-disk code. This
is the signature of a **phantom error**: a stale-cache artifact from a
long-running incremental typechecker (webpack-dev-server / `tsc --watch` /
fork-ts-checker) or an editor's TypeScript language server that still held
`dataGen.ts` in its cached module graph and never invalidated it when the file was
removed out from under the watcher. Deleting a file **and** changing a type
signature in the same edit is a common trigger for this incremental-typecheck
staleness.

The trap is that the error *looks* like a real defect and invites you to "fix" the
code — but editing anything here risks reintroducing exactly what the refactor
just removed (re-adding the deleted file, or re-exporting the removed type).

## Guidance

When a TypeScript/webpack (or any incremental build / editor) error names a file
or symbol you **just deleted or renamed** — or the error is self-contradictory,
pointing at a path that no longer exists — do **not** start editing code to
satisfy it. First establish ground truth against the on-disk tree, then act on
what that proves:

1. Confirm the file is actually gone: `ls src/dataGen.ts` and
   `git ls-files | grep dataGen`.
2. Confirm the working tree is clean: `git status`.
3. Confirm no references remain: `grep -rn "dataGen\|RawPlayerEntry" src/ test/`.
4. Confirm a **fresh** build from a clean state passes:
   `rm -rf dist && npm run build` (or the project's equivalent clean build).

If the tree is clean, nothing references the symbol, and a fresh build compiles
successfully, the error is **not a real defect** — it is a stale module graph held
by a long-running process. The fix is to restart that process, not to change code:

- **Restart the watcher:** kill the running `npm run serve` (Ctrl-C) and re-run it
  so webpack/ts-loader rebuilds the module graph from the current tree.
- **Restart the editor's TS server:** VS Code -> Command Palette -> "TypeScript:
  Restart TS Server" (or reload the window); JetBrains -> File -> Invalidate
  Caches / Restart.

## Why This Matters

Chasing a phantom error by editing code is worse than doing nothing: to satisfy a
message about a deleted file importing a removed symbol, you would either re-add
`src/dataGen.ts` or re-export `RawPlayerEntry` — undoing the very refactor that was
just completed and reintroducing dead code or a dead type. You would also burn time
debugging a defect that does not exist.

The ground-truth checks are cheap and decisive. They separate "the code is wrong"
from "a cached process is lying to me," and they point directly at the correct
remedy. Recognizing the tell — an error that is *logically impossible given the
current tree*, or that only you (with a stale watcher) see while a teammate or CI
sees green — is the durable skill. It generalizes far past this one incident: every
incremental toolchain can lag on delete-plus-rename edits.

## When to Apply

Reach for this heuristic any time a long-running, incremental process reports an
error that references something you just changed:

- Incremental builders: **webpack-dev-server**, `tsc --watch`, Vite, nodemon,
  esbuild watch, and similar.
- Editor language servers: the TypeScript server in VS Code / JetBrains, and other
  LSP-backed typecheckers.

Suspect a phantom error especially when:

- The error names a **just-deleted, renamed, or moved** file, or a
  **just-removed export**.
- The refactor **deleted files and changed type signatures together** (the classic
  staleness trigger).
- The error is **logically impossible** given the current on-disk tree.
- A **teammate or CI sees no such error** — a strong signal the fault is local and
  cache-bound.

If instead the fresh clean build *also* fails, this heuristic does not apply — that
is a genuine defect, so fix the code.

## Examples

**The self-contradictory error (the tell):**

```
ERROR in src/dataGen.ts 1:23-37
[tsl] ERROR in src/dataGen.ts(1,24)
      TS2724: '"./types"' has no exported member named 'RawPlayerEntry'. Did you mean 'PlayerEntry'?
```

`src/dataGen.ts` was deleted and `RawPlayerEntry` was removed in the same change,
so this file+symbol combination cannot exist on disk.

**The verification recipe (prove the tree is clean):**

```bash
ls src/dataGen.ts                              # -> No such file or directory (gone from disk)
git ls-files | grep dataGen                    # -> (no output; gone from git)
git status                                     # -> clean working tree
grep -rn "dataGen\|RawPlayerEntry" src/ test/  # -> no matches anywhere
rm -rf dist && npm run build                   # -> "compiled successfully"
```

All four checks pass and the fresh build is clean — plus CI on the merged PR is
green. The code is correct; the error is a stale-cache phantom.

**The resolution (no code change):**

- Kill the running `npm run serve` (Ctrl-C) and re-run it to rebuild the module
  graph from the current tree.
- In VS Code, run Command Palette -> "TypeScript: Restart TS Server" (or reload the
  window); in JetBrains, File -> Invalidate Caches / Restart.

After restarting the watcher and the editor's TS server, the phantom TS2724
disappears — no file was re-added and no type was re-exported.

## Related

- `docs/solutions/tooling-decisions/github-pages-project-subpath-public-path.md` — the other webpack/build-tooling learning in this repo (deployment `PUBLIC_PATH`); unrelated root cause, listed as a sibling.
- No matching GitHub issues found.
