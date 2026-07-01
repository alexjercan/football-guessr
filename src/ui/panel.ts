import crestPlaceholder from "../assets/crest-placeholder.svg";
import { GameView } from "../types";

/**
 * Guess/hint info panel. Gives the revealed clubs more visual weight than a
 * plain list — each is a card with a (placeholder) crest and the club name —
 * and collects the player's past wrong guesses in a scrollable stack.
 *
 * This module owns only the DOM. It caches the panel markup once (like
 * `modal.ts`) and mutates it on each {@link renderPanel}. All game logic stays
 * in `game.ts`; the panel is a pure projection of the {@link GameView}.
 *
 * Adapted from the reference `panel.ts`: a slide-in **drawer** opened by a small
 * pull tab. The open/close state machine (`openPanel` / `closePanel` /
 * `closePanelManually` / `isPanelOpen`) carries over, including the
 * "manually closed" memory — once the player closes the drawer themselves it
 * stays closed even when a fresh hint would otherwise auto-open it, until they
 * pull it open again. The content is rebuilt for this game (a flat chronological
 * club list, not a species/clade tree).
 *
 * Crest art: we have no real club-crest assets yet, so every card shows a
 * shared generic shield placeholder with the club's initials overlaid. Swapping
 * in real per-club crests later is a data/asset change only (see the V3 assets
 * task) — this rendering code won't need to change.
 */

interface PanelElements {
    /** The drawer container; `.active` slides it in. */
    panel: HTMLElement;
    /** The pull tab that opens the drawer (visible when the drawer is closed). */
    pull: HTMLElement;
    /** The close (×) control inside the drawer header. */
    closeBtn: HTMLElement;
    /** Where revealed-club cards are rendered. */
    clubsList: HTMLElement;
    /** Where past wrong-guess cards are rendered. */
    guessesList: HTMLElement;
    /** "No wrong guesses yet" placeholder shown when the guess list is empty. */
    guessesEmpty: HTMLElement;
}

let cached: PanelElements | null = null;
let wired = false;
/** Whether the drawer is currently slid in. */
let open = false;
/**
 * Set once the player closes the drawer themselves. While true, a newly
 * revealed club won't auto-open the drawer — it respects that the player wants
 * it out of the way. Cleared the moment they pull it open again.
 */
let manuallyClosed = false;
/**
 * How many clubs were revealed on the previous render. A jump upward means a
 * fresh hint just landed, which is what triggers an auto-open (unless the
 * drawer was manually closed). Starts at -1 so the very first paint counts as
 * "new" and the drawer greets the player with the opening hint.
 */
let lastRevealedCount = -1;

/** Look up the panel markup once; returns null if it isn't present. */
function getElements(): PanelElements | null {
    if (cached) {
        return cached;
    }

    const panel = document.querySelector<HTMLElement>("#hint-panel");
    const pull = document.querySelector<HTMLElement>("#hint-panel-pull");
    const closeBtn = document.querySelector<HTMLElement>("#hint-panel-close");
    const clubsList = document.querySelector<HTMLElement>("#hint-panel-clubs");
    const guessesList = document.querySelector<HTMLElement>(
        "#hint-panel-guesses"
    );
    const guessesEmpty = document.querySelector<HTMLElement>(
        "#hint-panel-guesses-empty"
    );

    if (
        !panel ||
        !pull ||
        !closeBtn ||
        !clubsList ||
        !guessesList ||
        !guessesEmpty
    ) {
        return null;
    }

    cached = { panel, pull, closeBtn, clubsList, guessesList, guessesEmpty };
    return cached;
}

/** Reflect the current open/closed state onto the DOM (classes + ARIA). */
function applyOpenState(els: PanelElements): void {
    els.panel.classList.toggle("active", open);
    els.panel.setAttribute("aria-hidden", open ? "false" : "true");
    // The pull tab is only offered when the drawer is closed.
    els.pull.hidden = open;
    els.pull.setAttribute("aria-expanded", open ? "true" : "false");
}

/** Attach the pull-tab / close-button handlers once. */
function ensureWired(els: PanelElements): void {
    if (wired) {
        return;
    }
    wired = true;
    els.pull.addEventListener("click", () => openPanel());
    els.closeBtn.addEventListener("click", () => closePanelManually());
}

/** Is the drawer currently open? */
export function isPanelOpen(): boolean {
    return open;
}

/**
 * Open the drawer (no-op if markup is missing). Opening always clears the
 * "manually closed" memory: an explicit pull is the player opting back in.
 */
export function openPanel(): void {
    const els = getElements();
    if (!els) {
        return;
    }
    open = true;
    manuallyClosed = false;
    applyOpenState(els);
}

/**
 * Close the drawer programmatically (no-op if markup is missing). Does *not*
 * set the "manually closed" memory — use {@link closePanelManually} for a
 * player-initiated close.
 */
export function closePanel(): void {
    const els = getElements();
    if (!els) {
        return;
    }
    open = false;
    applyOpenState(els);
}

/**
 * Close the drawer because the player asked to (the × button). Remembers the
 * intent so a subsequent fresh hint won't pop it back open.
 */
export function closePanelManually(): void {
    manuallyClosed = true;
    closePanel();
}

/** Flip the drawer between open and (manually) closed. */
export function togglePanel(): void {
    if (open) {
        closePanelManually();
    } else {
        openPanel();
    }
}

/**
 * Derive up to two uppercase initials for a crest badge from a club name:
 * first letters of the first two significant words ("Paris Saint-Germain" ->
 * "PS", "Barcelona" -> "BA"). Purely cosmetic, so short/odd names degrade
 * gracefully rather than erroring.
 */
export function clubInitials(name: string): string {
    const words = name
        .split(/[\s-]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

    if (words.length === 0) {
        return "?";
    }
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Build a card for one revealed club: a placeholder crest (shared shield SVG
 * with the club's initials overlaid) plus the club name. `latest` styles the
 * most-recently-revealed club as the "current hint".
 */
export function createClubCard(name: string, latest = false): HTMLElement {
    const card = document.createElement("li");
    card.className = "hint-card";
    if (latest) {
        card.classList.add("hint-card--latest");
    }

    const crest = document.createElement("div");
    crest.className = "hint-card__crest";

    // The shared placeholder shield. `alt=""` because the initials badge and
    // the adjacent name already convey the club — the image is decorative.
    const img = document.createElement("img");
    img.className = "hint-card__crest-img";
    img.src = crestPlaceholder;
    img.alt = "";

    const initials = document.createElement("span");
    initials.className = "hint-card__crest-initials";
    initials.textContent = clubInitials(name);

    crest.appendChild(img);
    crest.appendChild(initials);

    const label = document.createElement("span");
    label.className = "hint-card__name";
    label.textContent = name;

    if (latest) {
        const badge = document.createElement("span");
        badge.className = "hint-card__badge";
        badge.textContent = "Latest";
        label.appendChild(badge);
    }

    card.appendChild(crest);
    card.appendChild(label);
    return card;
}

/** Build a compact card for one past (wrong) guess: just the name for now. */
export function createGuessCard(name: string): HTMLElement {
    const card = document.createElement("li");
    card.className = "hint-guess";

    const label = document.createElement("span");
    label.className = "hint-guess__name";
    label.textContent = name;

    card.appendChild(label);
    return card;
}

/**
 * Repaint the panel from a {@link GameView}: rebuild the revealed-club cards
 * (newest first, so the freshest hint is at the top and flagged "Latest") and
 * the list of past wrong guesses. Called on every render; safe to call when the
 * panel markup is absent (e.g. a page without the panel) — it just no-ops.
 *
 * Also drives the auto-open: whenever the revealed-club count grows (a new
 * hint), the drawer slides open — unless the player has manually closed it, in
 * which case it stays out of the way until they pull it open again.
 */
export function renderPanel(view: GameView): void {
    const els = getElements();
    if (!els) {
        return;
    }
    ensureWired(els);

    // Revealed clubs, most recent first. The last entry in `revealedClubs` is
    // the newest reveal, so it leads and gets the "latest" treatment.
    els.clubsList.textContent = "";
    const clubs = view.revealedClubs;
    for (let i = clubs.length - 1; i >= 0; i--) {
        const isLatest = i === clubs.length - 1;
        els.clubsList.appendChild(createClubCard(clubs[i], isLatest));
    }

    // Past *wrong* guesses, newest first so the most recent attempt is visible
    // without scrolling. On a win the reducer appends the correct guess to
    // `pastGuesses`, so drop that final entry — the crest cards and the win
    // modal already reveal the answer; it doesn't belong in the "wrong" list.
    els.guessesList.textContent = "";
    const wrongGuesses =
        view.status === "won"
            ? view.pastGuesses.slice(0, -1)
            : view.pastGuesses;
    for (let i = wrongGuesses.length - 1; i >= 0; i--) {
        els.guessesList.appendChild(createGuessCard(wrongGuesses[i]));
    }

    // Toggle the "nothing yet" placeholder.
    els.guessesEmpty.hidden = wrongGuesses.length > 0;

    // Auto-open on a fresh hint (more clubs revealed than last time), respecting
    // a manual close. `openPanel()` would clear `manuallyClosed`, so set the
    // open state directly here instead.
    const isNewHint = clubs.length > lastRevealedCount;
    lastRevealedCount = clubs.length;
    if (isNewHint && !manuallyClosed) {
        open = true;
    }
    applyOpenState(els);
}
