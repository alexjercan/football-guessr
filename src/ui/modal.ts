import confetti from "canvas-confetti";
import { MAX_GUESSES } from "../game";
import { ShareResult, buildShareText } from "../share";

/**
 * End-of-game modal (win/loss). Adapted from the reference `modal.ts`.
 * Visibility is toggled with the `.active` class on the overlay.
 *
 * This module owns only the DOM: it looks up the modal markup once and mutates
 * it. All game logic stays in `game.ts`; callers pass in the already-decided
 * player name and guess count from the `GameView`. The shareable text itself is
 * built by the pure `share.ts`; this module only copies it and gives feedback.
 */

/**
 * Confetti palette, tuned to pop against the pitch-green/dark theme: trophy gold
 * + pale gold, chalk white, and the pitch-green accent (the old warm tan was
 * dropped — it muddied against the green background).
 */
const CONFETTI_COLORS = ["#ffd700", "#ffec8b", "#ffffff", "#3fb950"];

interface ModalElements {
    overlay: HTMLElement;
    modal: HTMLElement;
    icon: HTMLElement;
    title: HTMLElement;
    message: HTMLElement;
    stats: HTMLElement;
    closeBtn: HTMLElement;
    /** Optional: the "Play Practice Mode" link (Daily has no "Play Again"). */
    practiceBtn: HTMLElement | null;
    /** Optional: the in-modal "Play Again" button (Practice only). */
    playAgainBtn: HTMLElement | null;
    /** Optional: the "Share" button (shown once a game has ended). */
    shareBtn: HTMLElement | null;
    /** Optional: the label span inside the share button (swapped for feedback). */
    shareLabel: HTMLElement | null;
}

/** Extra options for the end-of-game modal. */
export interface ModalOptions {
    /**
     * Show the "Play Practice Mode" button. Used on Daily, where there's no
     * in-page "Play Again", to route the player into endless practice.
     */
    showPractice?: boolean;
    /**
     * If provided, shows a "Play Again" button that runs this callback (and
     * closes the modal first). Used in Practice to start a fresh round without
     * leaving the modal. Omit for Daily, which has no restart.
     */
    onPlayAgain?: () => void;
    /**
     * If provided, shows a "Share" button that copies a Wordle-style, spoiler-
     * free summary of this result to the clipboard. Omit to hide the button.
     */
    share?: ShareResult;
}

let cached: ModalElements | null = null;
let wired = false;
/** Latest "Play Again" callback; invoked by the button's static click handler. */
let playAgainHandler: (() => void) | null = null;
/** Latest share payload; read by the share button's static click handler. */
let currentShare: ShareResult | null = null;
/** Pending timer that resets the share button label after feedback. */
let shareResetTimer: ReturnType<typeof setTimeout> | null = null;

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
    const practiceBtn = document.querySelector<HTMLElement>(
        "#modal-practice-btn"
    );
    const playAgainBtn = document.querySelector<HTMLElement>(
        "#modal-play-again-btn"
    );
    const shareBtn = document.querySelector<HTMLElement>("#modal-share-btn");
    const shareLabel =
        document.querySelector<HTMLElement>("#modal-share-label");

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

    cached = {
        overlay,
        modal,
        icon,
        title,
        message,
        stats,
        closeBtn,
        practiceBtn,
        playAgainBtn,
        shareBtn,
        shareLabel,
    };
    return cached;
}

/** Toggle the practice button's visibility (no-op if it's absent). */
function setPracticeVisible(els: ModalElements, visible: boolean): void {
    if (els.practiceBtn) {
        els.practiceBtn.hidden = !visible;
    }
}

/**
 * Register the "Play Again" callback and toggle the button accordingly. The
 * button itself is wired once in {@link ensureWired}; here we just swap in the
 * latest handler (or hide the button when there's nothing to do).
 */
function setPlayAgain(els: ModalElements, handler?: () => void): void {
    playAgainHandler = handler ?? null;
    if (els.playAgainBtn) {
        els.playAgainBtn.hidden = !handler;
    }
}

/** Reset the share button back to its idle "Share" label. */
function resetShareLabel(els: ModalElements): void {
    if (els.shareLabel) {
        els.shareLabel.textContent = "Share";
    }
}

/**
 * Store the share payload and toggle the button. Also clears any lingering
 * "Copied!" feedback from a previous game so the button reads "Share" again.
 */
function setShare(els: ModalElements, share?: ShareResult): void {
    currentShare = share ?? null;
    if (shareResetTimer !== null) {
        clearTimeout(shareResetTimer);
        shareResetTimer = null;
    }
    resetShareLabel(els);
    if (els.shareBtn) {
        els.shareBtn.hidden = !share;
    }
}

/**
 * Copy `text` to the clipboard, resolving to whether it worked. Tries the modern
 * async Clipboard API first, then falls back to a hidden `<textarea>` +
 * `execCommand("copy")` for older browsers and non-secure (HTTP) contexts where
 * `navigator.clipboard` is unavailable or rejects.
 */
async function copyToClipboard(text: string): Promise<boolean> {
    if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
    ) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the legacy path (e.g. permission denied, or the
            // page isn't a secure context).
        }
    }
    return legacyCopy(text);
}

/** Last-resort clipboard copy via a temporary, off-screen textarea. */
function legacyCopy(text: string): boolean {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // Keep it out of view and out of the layout/scroll.
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}

/**
 * Handle a share-button click: build the text from the current payload, copy
 * it, and flash the outcome on the button label ("Copied!" / "Copy failed"),
 * which resets back to "Share" after a moment.
 */
function handleShareClick(els: ModalElements): void {
    if (!currentShare) {
        return;
    }
    const text = buildShareText(currentShare);

    void copyToClipboard(text).then((ok) => {
        if (els.shareLabel) {
            els.shareLabel.textContent = ok ? "Copied!" : "Copy failed";
        }
        if (shareResetTimer !== null) {
            clearTimeout(shareResetTimer);
        }
        shareResetTimer = setTimeout(() => {
            resetShareLabel(els);
            shareResetTimer = null;
        }, 2000);
    });
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

    // "Play Again" closes the modal, then runs the current callback (if any).
    els.playAgainBtn?.addEventListener("click", () => {
        hideModal();
        playAgainHandler?.();
    });

    // "Share" copies the summary; the modal stays open so the player sees the
    // "Copied!" feedback and can still use the other buttons.
    els.shareBtn?.addEventListener("click", () => handleShareClick(els));

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
export function showWinModal(
    playerName: string,
    guessCount: number,
    options: ModalOptions = {}
): void {
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
    setPracticeVisible(els, options.showPractice ?? false);
    setPlayAgain(els, options.onPlayAgain);
    setShare(els, options.share);

    showModal(els);
    fireConfetti();
}

/** Show the loss modal (no confetti). `playerName` is the revealed answer. */
export function showLossModal(
    playerName: string,
    options: ModalOptions = {}
): void {
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
    setPracticeVisible(els, options.showPractice ?? false);
    setPlayAgain(els, options.onPlayAgain);
    setShare(els, options.share);

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
