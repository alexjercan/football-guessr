# V2 Step 12 — Share Result (optional, stretch)

- STATUS: OPEN
- PRIORITY: 60
- TAGS: ux,stretch

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 12.

**Goal:** Wordle-style "share your result" button on the win/loss modal —
copies an emoji/text summary to clipboard, no answer spoilers.

**Reference:** `modal.ts`'s unused `modalShareBtn`/`shareIcon` wiring is the
seed for this; nothing else in the provided snippets covers the actual share
logic (needs to be written fresh).

**Checklist:**
- [ ] Format: something like `⚽ Football Club Guesser — Daily #14 — 4/25
      guesses 🟩🟩🟥🟥` (green squares = clubs revealed before the win, red =
      wasted guesses — pick whatever mapping feels honest to how the game
      plays)
- [ ] `navigator.clipboard.writeText(...)` with a fallback message if
      unavailable (older browsers / non-HTTPS contexts)
- [ ] Only show the share button once the game has ended (reuse
      `showWinModal`/`showLossModal` from Step 8)
- [ ] No copyrighted crest emoji or club logos in the share text — plain
      unicode squares only

**Depends on:** Step 8 (modal) for the button's home; benefits from Step 9
(daily numbering) for the "Daily #N" line but can ship without it.
