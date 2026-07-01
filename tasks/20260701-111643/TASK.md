# V2 Step 8 — Win / Loss Modal (with confetti)

- STATUS: CLOSED
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
- [x] Add modal markup to `src/index.html`: `#modal-overlay`, `#modal`,
      `#modal-icon`, `#modal-title`, `#modal-message`, `#modal-stats`,
      `#modal-close-btn` (hidden by default, shown via the `.active` class on
      the overlay). Wrapped as `role="dialog"` + `aria-modal`.
- [x] New `src/ui/modal.ts` with `showWinModal(playerName, guessCount)` /
      `showLossModal(playerName)`, adapted from the snippet. Imports
      `MAX_GUESSES` from `../game` (not redefined). Share button dropped.
- [x] In `mountGame.ts`'s `render(view)`: on `status === "won"` call
      `showWinModal`, on `status === "lost"` call `showLossModal`. The
      `#status` text update is kept **in addition** (the `aria-live` region
      still announces the result for screen readers).
- [x] Confetti only on win, never on loss.
- [x] Modal close button + backdrop-click-to-close (+ Escape). On Daily there's
      no "Play Again", so closing just dismisses the modal over the board.
- [x] Verify modal doesn't break the `#play-again` flow: "Play Again" hides the
      modal and re-arms the once-per-game guard before restarting.

**Behavior / decisions:**
- **Once-per-game guard:** `render` runs on every guess, so the modal +
  confetti fire only on the *transition* into a terminal status
  (`shownEndStatus` tracks the last-shown status); "Play Again" resets it.
- **Focus:** on game end, focus moves to the modal's OK button; `submitResolved`
  no longer yanks focus back to the (now-disabled) input. Escape/backdrop/OK
  all close, so the dialog never traps focus.
- **Confetti:** gold/amber palette matching the CSS theme; passes
  `disableForReducedMotion: true` so it no-ops for `prefers-reduced-motion`.
- **XSS-safety:** the answer is inserted as a text node inside a `<strong>`
  (DOM `append`), not via `innerHTML` as in the reference snippet.
- **Coverage:** `src/ui/**` stays excluded from coverage (DOM-only), same as
  the other UI modules; full `npm run ci` is green (62 tests).

**Depended on by:** Step 12 (Share Result) uses this modal as the share
button's home.

Code snippet from another project similar to this task:

```ts
import confetti from "canvas-confetti";
import shareIcon from "../assets/share.svg";
import { MAX_GUESSES } from "../constants";

const overlay = document.getElementById("modal-overlay");
const modal = document.getElementById("modal");
const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalStats = document.getElementById("modal-stats");
const modalCloseBtn = document.getElementById("modal-close-btn");

function showModal() {
    overlay?.classList.add("active");
}

function hideModal() {
    overlay?.classList.remove("active");
}

// Close when clicking the backdrop (but not the modal itself)
overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hideModal();
});

// Close via the OK button
modalCloseBtn?.addEventListener("click", () => hideModal());

// Add the share SVG to the share button in the modal
const modalShareBtn = document.getElementById("modal-share-btn");
const shareBtnIcon = modalShareBtn?.querySelector("img");
if (shareBtnIcon) {
    shareBtnIcon.src = shareIcon;
    shareBtnIcon.alt = "Share";
}

export function showWinModal(speciesName: string, guessCount: number) {
    if (modalIcon) modalIcon.textContent = "🏆";
    if (modalTitle) {
        modalTitle.textContent = "You found it!";
        modalTitle.className = "modal-title modal-title-win";
    }
    if (modalMessage) {
        modalMessage.innerHTML = `The answer was <strong>${speciesName}</strong>`;
    }
    if (modalStats) {
        modalStats.textContent = `Solved in ${guessCount} / ${MAX_GUESSES} guesses`;
    }

    if (modal) {
        modal.className = "modal modal-win";
    }

    showModal();
    fireConfetti();
}

export function showLossModal(speciesName: string) {
    if (modalIcon) modalIcon.textContent = "💀";
    if (modalTitle) {
        modalTitle.textContent = "Game Over";
        modalTitle.className = "modal-title modal-title-loss";
    }
    if (modalMessage) {
        modalMessage.innerHTML = `The answer was <strong>${speciesName}</strong>`;
    }
    if (modalStats) {
        modalStats.textContent = `You used all ${MAX_GUESSES} guesses`;
    }

    if (modal) {
        modal.className = "modal modal-loss";
    }

    showModal();
}

function fireConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ["#ffd700", "#e6a861", "#ffec8b"],
        });
        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ["#ffd700", "#e6a861", "#ffec8b"],
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    // Initial burst
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ffd700", "#e6a861", "#ffec8b", "#fff"],
    });

    frame();
}
```
