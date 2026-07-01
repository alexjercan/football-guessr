# V2 Step 12 — Share Result (optional, stretch)

- STATUS: CLOSED
- PRIORITY: 60
- TAGS: ux,stretch

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 12.

## Implementation summary

Added a Wordle-style "Share" button to the end-of-game modal. It copies a
spoiler-free summary to the clipboard, e.g.:

```
⚽ Football Guessr — Daily #14 — 4/25

🟥🟥🟥🟩
```

Square mapping (chosen: **one square per guess**): 🟥 per wrong guess, 🟩 for
the winning guess; a loss is all 🟥. Rows wrap every 5 squares so a long game
(up to a 25-guess loss) stays readable. No answer, no crests/logos — plain
Unicode only.

Files:
- `src/share.ts` — **pure**, DOM-free builders: `ShareResult` +
  `buildShareHeadline` / `buildShareGrid` / `buildShareText`. 100% covered.
- `test/share.test.ts` — 14 tests (win/loss, first-guess win, row wrapping,
  daily-vs-practice heading, spoiler-free, unicode-only).
- `src/ui/modal.ts` — share button lookup + `setShare()`, click → clipboard
  with a legacy `<textarea>+execCommand` fallback, and "Copied!" / "Copy failed"
  label feedback that resets after 2s. Extended `ModalOptions` with `share?`.
- `src/index.html` — `#modal-share-btn` (with `#modal-share-label`) in the modal
  actions, hidden by default.
- `src/ui/mountGame.ts` — passes the `share` payload (mode, won, guessesUsed,
  maxGuesses, puzzleNumber) into the modal on the terminal transition.
- `src/style.css` — `.modal__share-btn` styling.

Key decisions:
- **Pure/DOM split** (matches the repo convention): all text generation lives in
  the testable `share.ts`; `modal.ts` only copies + gives feedback. `src/ui/**`
  stays coverage-excluded, `share.ts` is fully unit-tested.
- **Clipboard fallback**: tries `navigator.clipboard.writeText` first (async,
  needs a secure context), falls back to a hidden textarea + `execCommand`, and
  the button flashes "Copy failed" if both fail — no crash, no silent no-op.
- **Modal stays open** after Share so the player sees the feedback and can still
  use OK / Play Again / Practice.

Verified: `npm run ci` (format:check + lint + test:coverage, 125 passing),
`tsc --noEmit`, and `npm run build` all pass; share button present in the built
`index.html`, HTML↔TS ids match.

**Checklist:**
- [x] Format: `⚽ Football Guessr — Daily #14 — 4/25` + emoji grid (🟩 win
      square, 🟥 wrong-guess squares; one square per guess)
- [x] `navigator.clipboard.writeText(...)` with a legacy fallback + failure
      feedback (older browsers / non-HTTPS contexts)
- [x] Share button only shown once the game has ended (via
      `showWinModal`/`showLossModal` `share` option)
- [x] No copyrighted crest emoji or club logos — plain unicode squares only
      (a test asserts the grid contains nothing but 🟥/🟩/newlines)
