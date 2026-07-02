import crestPlaceholder from "../assets/crest-placeholder.svg";
import { GameView } from "../types";

/**
 * Guess/hint info panel. Renders the revealed clubs (each a card with a
 * placeholder crest + name, the newest flagged "Latest") and the past wrong
 * guesses.
 *
 * The panel is **always visible and in-flow** — a right-hand column beside the
 * game on wide screens, stacked below it on narrow screens (see `.game-layout`
 * / `.hint-panel` in `src/style.css`). There is no open/close drawer. This
 * module owns only the DOM: it caches the content containers once and repaints
 * them on each {@link renderPanel} from the {@link GameView}. All game logic
 * stays in `game.ts`.
 *
 * Crest art: a shared placeholder shield with the club's initials overlaid,
 * until real per-club crests exist (V3 assets task) — this rendering won't need
 * to change then.
 */

interface PanelElements {
    /** Where revealed-club cards are rendered. */
    clubsList: HTMLElement;
    /** Where past wrong-guess cards are rendered. */
    guessesList: HTMLElement;
    /** "No wrong guesses yet" placeholder shown when the guess list is empty. */
    guessesEmpty: HTMLElement;
}

let cached: PanelElements | null = null;

/** Look up the panel content containers once; returns null if absent. */
function getElements(): PanelElements | null {
    if (cached) {
        return cached;
    }

    const clubsList = document.querySelector<HTMLElement>("#hint-panel-clubs");
    const guessesList = document.querySelector<HTMLElement>(
        "#hint-panel-guesses"
    );
    const guessesEmpty = document.querySelector<HTMLElement>(
        "#hint-panel-guesses-empty"
    );

    if (!clubsList || !guessesList || !guessesEmpty) {
        return null;
    }

    cached = { clubsList, guessesList, guessesEmpty };
    return cached;
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

/**
 * Build a compact card for one past (wrong) guess. A small "red card" chip
 * (referee booking) leads the name — a wrong guess is a booking against you.
 */
export function createGuessCard(name: string): HTMLElement {
    const card = document.createElement("li");
    card.className = "hint-guess";

    // Decorative red card; the adjacent name carries the meaning for a11y.
    const redCard = document.createElement("span");
    redCard.className = "hint-guess__card";
    redCard.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "hint-guess__name";
    label.textContent = name;

    card.appendChild(redCard);
    card.appendChild(label);
    return card;
}

/**
 * Repaint the panel from a {@link GameView}: rebuild the revealed-club cards
 * (newest first, so the freshest hint is at the top and flagged "Latest") and
 * the list of past wrong guesses. Called on every render; safe to call when the
 * panel markup is absent (e.g. a page without the panel) — it just no-ops.
 */
export function renderPanel(view: GameView): void {
    const els = getElements();
    if (!els) {
        return;
    }

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
}
