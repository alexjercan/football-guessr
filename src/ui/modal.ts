import confetti from "canvas-confetti";
import { MAX_GUESSES } from "../game";

/**
 * End-of-game modal (win/loss). Adapted from the reference `modal.ts`; the
 * share button is intentionally omitted — Step 12 owns that. Visibility is
 * toggled with the `.active` class on the overlay.
 *
 * This module owns only the DOM: it looks up the modal markup once and mutates
 * it. All game logic stays in `game.ts`; callers pass in the already-decided
 * player name and guess count from the `GameView`.
 */

/** Palette reused from the game's CSS custom properties (gold/amber theme). */
const CONFETTI_COLORS = ["#ffd700", "#e6a861", "#ffec8b", "#ffffff"];

interface ModalElements {
    overlay: HTMLElement;
    modal: HTMLElement;
    icon: HTMLElement;
    title: HTMLElement;
    message: HTMLElement;
    stats: HTMLElement;
    closeBtn: HTMLElement;
}

let cached: ModalElements | null = null;
let wired = false;

/** Look up the modal markup once; returns null if it isn't present. */
function getElements(): ModalElements | null {
    if (cached) {
        return cached;
    }

    const overlay = document.querySelector<HTMLElement>("#modal-overlay");
    const modal = document.querySelector<HTMLElement>("#modal");
    const icon = document.querySelector<HTMLElement>("#modal-icon");
    const title = document.querySelector<HTMLElement>("#modal-title");
    const message = document.querySelector<HTMLElement>("#modal-message");
    const stats = document.querySelector<HTMLElement>("#modal-stats");
    const closeBtn = document.querySelector<HTMLElement>("#modal-close-btn");

    if (
        !overlay ||
        !modal ||
        !icon ||
        !title ||
        !message ||
        !stats ||
        !closeBtn
    ) {
        return null;
    }

    cached = { overlay, modal, icon, title, message, stats, closeBtn };
    return cached;
}

/** Attach close handlers once (backdrop click, OK button, Escape key). */
function ensureWired(els: ModalElements): void {
    if (wired) {
        return;
    }
    wired = true;

    // Backdrop click (but not clicks inside the modal) closes it.
    els.overlay.addEventListener("click", (event) => {
        if (event.target === els.overlay) {
            hideModal();
        }
    });

    els.closeBtn.addEventListener("click", () => hideModal());

    // Escape closes too — avoids trapping the user inside the dialog.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isModalOpen()) {
            hideModal();
        }
    });
}

/** Is the modal currently shown? */
export function isModalOpen(): boolean {
    return getElements()?.overlay.classList.contains("active") ?? false;
}

/** Hide the modal (no-op if markup is missing or already hidden). */
export function hideModal(): void {
    getElements()?.overlay.classList.remove("active");
}

function showModal(els: ModalElements): void {
    ensureWired(els);
    els.overlay.classList.add("active");
    // Move focus to the OK button so keyboard users can dismiss immediately,
    // and so focus isn't left on a now-disabled input behind the overlay.
    els.closeBtn.focus();
}

/**
 * Show the win modal and celebrate. `playerName` is the revealed answer and
 * `guessCount` is how many guesses it took.
 */
export function showWinModal(playerName: string, guessCount: number): void {
    const els = getElements();
    if (!els) {
        return;
    }

    els.icon.textContent = "🏆";
    els.title.textContent = "You found it!";
    els.message.textContent = "";
    els.message.append("The answer was ", strong(playerName));
    els.stats.textContent = `Solved in ${guessCount} / ${MAX_GUESSES} guesses`;
    els.modal.className = "modal modal--win";

    showModal(els);
    fireConfetti();
}

/** Show the loss modal (no confetti). `playerName` is the revealed answer. */
export function showLossModal(playerName: string): void {
    const els = getElements();
    if (!els) {
        return;
    }

    els.icon.textContent = "💀";
    els.title.textContent = "Game Over";
    els.message.textContent = "";
    els.message.append("The answer was ", strong(playerName));
    els.stats.textContent = `You used all ${MAX_GUESSES} guesses`;
    els.modal.className = "modal modal--loss";

    showModal(els);
}

/** Build a <strong> node from untrusted text (avoids innerHTML injection). */
function strong(text: string): HTMLElement {
    const el = document.createElement("strong");
    el.textContent = text;
    return el;
}

/** Confetti burst + a short side-cannon stream. Win only. */
function fireConfetti(): void {
    // `confetti` respects prefers-reduced-motion and no-ops when it can't run.
    const options = { disableForReducedMotion: true } as const;

    // Initial burst.
    void confetti({
        ...options,
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
    });

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = (): void => {
        void confetti({
            ...options,
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: CONFETTI_COLORS,
        });
        void confetti({
            ...options,
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: CONFETTI_COLORS,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
}
