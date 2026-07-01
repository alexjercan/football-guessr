# V2 Step 8 — Win / Loss Modal (with confetti)

- STATUS: OPEN
- PRIORITY: 85
- TAGS: ux,polish

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 8.

**Goal:** Replace the plain `#status` text with a proper end-of-game modal —
clearer win/loss moment, room for stats and a share button later (Step 12).

**Reference:** `modal.ts` — reusable close to as-is:
- Needs `canvas-confetti` as a new dependency (`npm install canvas-confetti
  @types/canvas-confetti`)
- `speciesName` → target player's `name`; `MAX_GUESSES` already exists as a
  constant in `src/game.ts` (Step 4) — import it, don't redefine
- `guessCount` → `view.guessesUsed`
- Drop the `shareIcon`/share-button wiring for now (Step 12 owns that) unless
  you want to stub the button hidden

**Checklist:**
- [ ] Add modal markup to `src/index.html`: `#modal-overlay`, `#modal`,
      `#modal-icon`, `#modal-title`, `#modal-message`, `#modal-stats`,
      `#modal-close-btn` (hidden by default, shown via `.active` class)
- [ ] New `src/ui/modal.ts` with `showWinModal(playerName, guessCount)` /
      `showLossModal(playerName)`, adapted from the snippet
- [ ] In `mountGame.ts`'s `render(view)`: on `status === "won"` call
      `showWinModal`, on `status === "lost"` call `showLossModal`, instead of
      (or in addition to) the current `#status` text update
- [ ] Confetti only on win, never on loss
- [ ] Modal close button + backdrop-click-to-close; on Daily mode there's no
      "Play Again" so closing just leaves the modal dismissed with the board
      visible underneath
- [ ] Verify modal doesn't trap focus in a way that breaks the
      `#play-again` button flow already wired in Step 5

**Depended on by:** Step 12 (Share Result) uses this modal as the share
button's home.
