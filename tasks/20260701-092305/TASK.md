# V1 Step 5 — HTML Page to Play the Game

- STATUS: OPEN
- PRIORITY: 40
- TAGS: ui,html

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 5.

**Goal:** Minimal, unstyled UI that lets a human actually play using the Step 4 logic.

**Checklist:**
- [ ] `src/index.html`: club hint area, guess text input, submit button, guesses-remaining counter, result/status message area
- [ ] `src/index.ts`: wire DOM to the game logic — on submit call `submitGuess` and re-render hints/guesses-left/status; win shows player name; loss shows "Game Over" + correct answer; "Play Again" resets via `startGame()`
- [ ] No CSS required (default browser styling is fine for V1)
- [ ] Manual playtest: `npm run serve`, play a full game to both a win and a loss

**Current status (OPEN):** Not started. `src/index.html` is only a shell (`#header`, `<main>`, `#footer` populated by the HtmlPartials plugin) with no game UI. `src/index.ts` only imports `style.css` and has no DOM wiring. Depends on Step 4.

