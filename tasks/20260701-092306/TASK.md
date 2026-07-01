# V1 Step 6 — Wrap-up & Sanity Check

- STATUS: CLOSED
- PRIORITY: 35
- TAGS: qa,release

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 6.

**Goal:** Confirm V1 is genuinely playable end-to-end before calling it done.

**Checklist:**
- [x] `npm run build` produces a working `dist/` that can be opened/served standalone
- [x] Play through at least 3 full games (1 win, 1 loss by guesses, 1 loss/continue-without-hints scenario)
- [x] Update `README.md` with final run instructions
- [x] Note ideas explicitly out of scope for V1 (styling, larger dataset, fuzzy name matching, autocomplete, club crests, difficulty levels)

**Current status (CLOSED):** V1 is complete and playable end-to-end. `npm run build`
produces a working standalone `dist/`, all checklist items are done, and the game
logic is green (41 Jest tests across game/matching/helpers). `README.md` now
documents the final run instructions (Daily + Practice, serving `dist/` over HTTP)
and the V1 out-of-scope list.

