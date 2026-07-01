import { loadGameData } from "../dataLoader";
import { createGame } from "../game";
import { namesMatch, resolveGuess } from "../matching";
import { GameView } from "../types";
import { setupAutocomplete } from "./autocomplete";

export interface MountGameOptions {
    /** Random source in [0, 1); the seam that separates Daily from Practice. */
    rng: () => number;
    /** Which entry point mounted the game: affects labelling and "Play Again". */
    mode: "daily" | "practice";
}

/**
 * Shared bootstrap for both entry points. Loads the data, wires the DOM to the
 * pure game logic from Step 4, and renders. The only thing that differs between
 * Daily and Practice is the injected `rng` and the `mode` flag.
 */
export async function mountGame({
    rng,
    mode,
}: MountGameOptions): Promise<void> {
    const { players } = await loadGameData();
    const game = createGame(players, { rng });

    // Derived once: the closed set of names a guess is allowed to resolve to.
    const playerNames = players.map((p) => p.name);

    const modeEl = document.querySelector<HTMLElement>("#mode");
    const clubsEl = document.querySelector<HTMLUListElement>("#clubs");
    const formEl = document.querySelector<HTMLFormElement>("#guess-form");
    const inputEl = document.querySelector<HTMLInputElement>("#guess-input");
    const autocompleteBox =
        document.querySelector<HTMLElement>("#autocomplete-box");
    const submitEl = document.querySelector<HTMLButtonElement>(
        "#guess-form button[type='submit']"
    );
    const guessesLeftEl = document.querySelector<HTMLElement>("#guesses-left");
    const statusEl = document.querySelector<HTMLElement>("#status");
    const playAgainEl =
        document.querySelector<HTMLButtonElement>("#play-again");

    if (
        !modeEl ||
        !clubsEl ||
        !formEl ||
        !inputEl ||
        !autocompleteBox ||
        !submitEl ||
        !guessesLeftEl ||
        !statusEl ||
        !playAgainEl
    ) {
        throw new Error("mountGame: required game markup is missing");
    }

    // Tracks the guesses already made so autocomplete can hide them.
    let pastGuesses: string[] = [];
    const isGuessed = (name: string): boolean =>
        pastGuesses.some((guess) => namesMatch(guess, name));

    const render = (view: GameView): void => {
        pastGuesses = view.pastGuesses;
        modeEl.textContent = mode === "daily" ? "Daily" : "Practice";

        // Revealed clubs (rebuild the list from scratch each render).
        clubsEl.textContent = "";
        for (const club of view.revealedClubs) {
            const li = document.createElement("li");
            li.textContent = club;
            clubsEl.appendChild(li);
        }

        guessesLeftEl.textContent = String(view.guessesRemaining);

        if (view.status === "won") {
            statusEl.textContent = `Correct! It was ${view.answer}.`;
        } else if (view.status === "lost") {
            statusEl.textContent = `Game Over — it was ${view.answer}.`;
        } else {
            statusEl.textContent = "";
        }

        // Lock input once the game is over.
        const isOver = view.status !== "playing";
        inputEl.disabled = isOver;
        submitEl.disabled = isOver;
        if (isOver) {
            autocomplete.close();
        }

        // "Play Again" only makes sense in Practice — Daily is one per day.
        playAgainEl.hidden = !(isOver && mode === "practice");
    };

    // Populate the input with a resolved, real name and submit it immediately.
    const submitResolved = (name: string): void => {
        inputEl.value = name;
        const view = game.submitGuess(name);
        inputEl.value = "";
        render(view);
        inputEl.focus();
    };

    const autocomplete = setupAutocomplete({
        inputEl,
        autocompleteBox,
        playerNames,
        isGuessed,
        onSelect: submitResolved,
    });

    formEl.addEventListener("submit", (event) => {
        event.preventDefault();
        // Fuzzy-resolve the raw text to a real, not-yet-guessed player name.
        // Invalid input (no match, e.g. "messss") resolves to null: we simply
        // clear the box and swallow it — never counted, never a hint, no alert.
        const resolved = resolveGuess(playerNames, inputEl.value, pastGuesses);
        inputEl.value = "";
        if (resolved !== null) {
            submitResolved(resolved);
        } else {
            autocomplete.close();
            inputEl.focus();
        }
    });

    playAgainEl.addEventListener("click", () => {
        const view = game.restart();
        inputEl.value = "";
        render(view);
        inputEl.focus();
    });

    render(game.getView());
    inputEl.focus();
}
