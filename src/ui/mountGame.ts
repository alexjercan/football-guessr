import { loadGameData } from "../dataLoader";
import { createGame } from "../game";
import { GameView } from "../types";

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

    const modeEl = document.querySelector<HTMLElement>("#mode");
    const clubsEl = document.querySelector<HTMLUListElement>("#clubs");
    const formEl = document.querySelector<HTMLFormElement>("#guess-form");
    const inputEl = document.querySelector<HTMLInputElement>("#guess-input");
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
        !submitEl ||
        !guessesLeftEl ||
        !statusEl ||
        !playAgainEl
    ) {
        throw new Error("mountGame: required game markup is missing");
    }

    const render = (view: GameView): void => {
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

        // "Play Again" only makes sense in Practice — Daily is one per day.
        playAgainEl.hidden = !(isOver && mode === "practice");
    };

    formEl.addEventListener("submit", (event) => {
        event.preventDefault();
        const view = game.submitGuess(inputEl.value);
        inputEl.value = "";
        render(view);
        inputEl.focus();
    });

    playAgainEl.addEventListener("click", () => {
        const view = game.restart();
        render(view);
        inputEl.focus();
    });

    render(game.getView());
    inputEl.focus();
}
