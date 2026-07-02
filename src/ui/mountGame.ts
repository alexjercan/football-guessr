import { loadGameData } from "../dataLoader";
import { createGame } from "../game";
import { GameMode, loadGame, saveGame } from "../gameStorage";
import { namesMatch, resolveGuess } from "../matching";
import { StorageProvider, defaultStorage } from "../storage";
import { GameStatus, GameView, PlayerEntry } from "../types";
import { setupAutocomplete } from "./autocomplete";
import { hideModal, showLossModal, showWinModal } from "./modal";
import { renderPanel } from "./panel";

export interface MountGameOptions {
    /** Random source in [0, 1); the seam that separates Daily from Practice. */
    rng: () => number;
    /** Which entry point mounted the game: affects labelling and "Play Again". */
    mode: GameMode;
    /**
     * The game's seed. Required for both modes: for Daily it's the UTC-day
     * integer (one save slot per day, resumed mid-game); for Practice it's the
     * epoch-ms timestamp the game started at (each finished play is its own
     * record). It keys the saved game either way.
     */
    seed: number;
    /** The "Daily #N" number to show in the mode label (Daily only). */
    puzzleNumber?: number;
    /** Storage backend; defaults to browser localStorage. Injectable for tests. */
    storage?: StorageProvider;
}

/**
 * Shared bootstrap for both entry points. Loads the data, wires the DOM to the
 * pure game logic from Step 4, and renders.
 *
 * Persistence differs by mode, but both write the same minimal
 * `{ mode, seed, playerId, guesses }` record:
 *   - Daily saves after every guess (so a mid-game refresh resumes exactly
 *     where you left off) and is reloaded on mount.
 *   - Practice is intentionally not resumed — it's meant to be replayable — so
 *     it writes nothing while in progress and saves a single record only once
 *     the game is won or lost (no half-finished practice clutter in storage).
 *
 * There's no separate results log: a stats page derives outcomes by replaying
 * each saved game's guesses against its player.
 */
export async function mountGame({
    rng,
    mode,
    seed,
    puzzleNumber,
    storage = defaultStorage(),
}: MountGameOptions): Promise<void> {
    const { players } = await loadGameData();

    // Derived once: the closed set of names a guess is allowed to resolve to.
    const playerNames = players.map((p) => p.name);

    // Resume a saved Daily game by forcing its target player, else pick fresh.
    // Practice is never resumed (it writes nothing until it finishes).
    const savedGuesses: string[] = [];
    let forcePlayer: PlayerEntry | undefined;
    if (mode === "daily") {
        const saved = loadGame("daily", seed, storage);
        if (saved) {
            const player = players.find((p) => p.id === saved.playerId);
            if (player) {
                forcePlayer = player;
                savedGuesses.push(...saved.guesses);
            }
        }
    }

    const game = createGame(players, { rng, forcePlayer });

    // Replay any saved guesses through the reducer to rebuild the exact state
    // (hints revealed, guesses used, won/lost) without a bespoke restore path.
    for (const guess of savedGuesses) {
        game.submitGuess(guess);
    }

    const modeEl = document.querySelector<HTMLElement>("#mode");
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
    const goPracticeEl =
        document.querySelector<HTMLAnchorElement>("#go-practice");

    if (
        !modeEl ||
        !formEl ||
        !inputEl ||
        !autocompleteBox ||
        !submitEl ||
        !guessesLeftEl ||
        !statusEl ||
        !playAgainEl ||
        !goPracticeEl
    ) {
        throw new Error("mountGame: required game markup is missing");
    }

    const modeLabel =
        mode === "daily"
            ? puzzleNumber
                ? `Daily #${puzzleNumber}`
                : "Daily"
            : "Practice";

    // The seed the *currently active* game saves under. Daily keeps its one
    // per-day seed for the whole session; Practice re-rolls a fresh timestamp
    // seed on every "Play Again" so each finished play becomes its own record
    // instead of overwriting the previous one.
    let currentSeed = seed;

    // Tracks the guesses already made so autocomplete can hide them.
    let pastGuesses: string[] = [];
    const isGuessed = (name: string): boolean =>
        pastGuesses.some((guess) => namesMatch(guess, name));

    // Only fire the end-of-game modal (and confetti) once per game, on the
    // transition into a terminal status — not on every re-render.
    let shownEndStatus: GameStatus | null = null;

    // Persist the current game as a single `{ mode, seed, playerId, guesses }`
    // record. Guesses are read straight from the view so this never depends on
    // render order. Timing differs by mode:
    //   - Daily: save on every call (resume-in-progress).
    //   - Practice: save only once the game is over, so unfinished practice
    //     games never touch storage.
    const persist = (view: GameView): void => {
        if (mode === "practice" && view.status === "playing") {
            return;
        }
        saveGame(
            {
                mode,
                seed: currentSeed,
                playerId: game.getPlayerId(),
                guesses: view.pastGuesses,
            },
            storage
        );
    };

    const render = (view: GameView): void => {
        pastGuesses = view.pastGuesses;
        modeEl.textContent = modeLabel;

        // Revealed clubs (career path) + wrong guesses live in the hint panel
        // (no-op if the panel markup isn't present).
        renderPanel(view);

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

        // End-of-game modal, exactly once per terminal transition. `answer` is
        // guaranteed non-null once the game is over (see toView).
        //   - Practice: an in-modal "Play Again" restarts without leaving.
        //   - Daily: a "Play Practice Mode" button, since there's no restart.
        if (isOver && view.status !== shownEndStatus) {
            shownEndStatus = view.status;
            const answer = view.answer ?? "";
            const modalOpts = {
                showPractice: mode === "daily",
                onPlayAgain: mode === "practice" ? startFreshGame : undefined,
                share: {
                    mode,
                    won: view.status === "won",
                    guessesUsed: view.guessesUsed,
                    maxGuesses: view.maxGuesses,
                    puzzleNumber,
                },
            };
            if (view.status === "won") {
                showWinModal(answer, view.guessesUsed, modalOpts);
            } else {
                showLossModal(answer, modalOpts);
            }
        }

        // End-of-game in-page actions: "Play Again" for Practice, a "Play
        // Practice Mode" link for Daily (which is one-per-day, no restart).
        playAgainEl.hidden = !(isOver && mode === "practice");
        goPracticeEl.hidden = !(isOver && mode === "daily");
    };

    // Populate the input with a resolved, real name and submit it immediately.
    const submitResolved = (name: string): void => {
        inputEl.value = name;
        const view = game.submitGuess(name);
        inputEl.value = "";
        persist(view);
        render(view);
        // Keep typing focus only while the game is live; once it's over, render
        // has moved focus to the modal, so don't yank it back to a dead input.
        if (view.status === "playing") {
            inputEl.focus();
        }
    };

    // Start a fresh game (Practice only). Shared by the in-page and in-modal
    // "Play Again" buttons: dismiss the modal, re-arm the once-per-game modal
    // guard, re-roll this game's save seed (so its eventual record is distinct),
    // re-pick a target, and repaint.
    const startFreshGame = (): void => {
        hideModal();
        shownEndStatus = null;
        currentSeed = Date.now();
        const view = game.restart();
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

    playAgainEl.addEventListener("click", startFreshGame);

    // Initial paint. A brand-new Daily writes its slot immediately (so a
    // same-day reopen resumes even with zero guesses); a resumed-finished Daily
    // re-saves its (unchanged) finished record. Practice writes nothing here —
    // `persist` is a no-op until the game is over.
    const initialView = game.getView();
    render(initialView);
    persist(initialView);

    if (initialView.status === "playing") {
        inputEl.focus();
    }
}
