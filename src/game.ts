import { PlayerEntry, GameState, GameView } from "./types";
import { chooseRandomPlayer } from "./helpers";
import { namesMatch } from "./matching";

/** Maximum number of guesses a player gets before the game is lost. */
export const MAX_GUESSES = 25;

/* -------------------------------------------------------------------------- */
/* Pure reducer                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Build the initial state for a game: the first club is revealed and no
 * guesses have been made yet.
 */
export function createInitialState(
    player: PlayerEntry,
    maxGuesses: number = MAX_GUESSES
): GameState {
    if (!player) {
        throw new Error("createInitialState: a target player is required");
    }
    return {
        player,
        // Reveal the first club immediately; a player always has >= 1 club in
        // practice, but Math.min keeps revealedCount sane for empty club lists.
        revealedCount: Math.min(1, player.clubs.length),
        guesses: [],
        maxGuesses,
        status: "playing",
    };
}

/**
 * Apply a single guess to the state and return the resulting (new) state.
 *
 * The reducer is pure — it never mutates its input. Order of evaluation:
 *   1. If the game is already over, do nothing.
 *   2. If the guess is empty/whitespace-only, do nothing (no count, no hint).
 *   3. Record the guess.
 *   4. Correct guess -> "won".
 *   5. Otherwise, if the guess limit is reached -> "lost".
 *   6. Otherwise reveal the next club if one is still hidden.
 *   7. Otherwise keep playing with no new hint.
 */
export function applyGuess(state: GameState, rawGuess: string): GameState {
    // 1. Terminal states are immutable.
    if (state.status !== "playing") {
        return state;
    }

    // 2. Ignore empty / whitespace-only submissions entirely.
    const guess = rawGuess.trim();
    if (guess.length === 0) {
        return state;
    }

    // 3. Record the guess.
    const guesses = [...state.guesses, guess];
    const guessesUsed = guesses.length;

    // 4. Correct guess wins, even on the final allowed guess.
    if (namesMatch(guess, state.player.name)) {
        return { ...state, guesses, status: "won" };
    }

    // 5. Out of guesses -> lost.
    if (guessesUsed >= state.maxGuesses) {
        return { ...state, guesses, status: "lost" };
    }

    // 6. Reveal the next club if any remain hidden (no-op once exhausted).
    const revealedCount =
        state.revealedCount < state.player.clubs.length
            ? state.revealedCount + 1
            : state.revealedCount;

    // 7. Keep playing.
    return { ...state, guesses, revealedCount };
}

/**
 * Project the internal state into a read-only view for the UI. The target
 * name is only exposed via `answer` once the game has ended.
 */
export function toView(state: GameState): GameView {
    const guessesUsed = state.guesses.length;
    const isOver = state.status !== "playing";
    return {
        revealedClubs: state.player.clubs.slice(0, state.revealedCount),
        guessesUsed,
        guessesRemaining: Math.max(0, state.maxGuesses - guessesUsed),
        maxGuesses: state.maxGuesses,
        status: state.status,
        outOfHints: state.revealedCount >= state.player.clubs.length,
        pastGuesses: [...state.guesses],
        answer: isOver ? state.player.name : null,
    };
}

/* -------------------------------------------------------------------------- */
/* Stateful facade                                                            */
/* -------------------------------------------------------------------------- */

export interface CreateGameOptions {
    /** Random source in [0, 1); defaults to Math.random. */
    rng?: () => number;
    /** Force a specific target player (handy for deterministic tests). */
    forcePlayer?: PlayerEntry;
    /** Override the guess limit; defaults to {@link MAX_GUESSES}. */
    maxGuesses?: number;
}

export interface Game {
    /** Submit a guess and return the updated view. */
    submitGuess(name: string): GameView;
    /** Read the current view without mutating state. */
    getView(): GameView;
    /** Start a fresh game (re-picking the target) and return its view. */
    restart(): GameView;
    /** Id of the current target player (for persistence keys/restore). */
    getPlayerId(): string;
}

/**
 * Thin stateful wrapper around the pure reducer for use by the UI.
 */
export function createGame(
    players: PlayerEntry[],
    opts: CreateGameOptions = {}
): Game {
    if (!players || players.length === 0) {
        throw new Error("createGame: at least one player is required");
    }

    const rng = opts.rng ?? Math.random;
    const maxGuesses = opts.maxGuesses ?? MAX_GUESSES;

    const pickPlayer = (): PlayerEntry =>
        opts.forcePlayer ?? chooseRandomPlayer(rng(), players);

    let state = createInitialState(pickPlayer(), maxGuesses);

    return {
        submitGuess(name: string): GameView {
            state = applyGuess(state, name);
            return toView(state);
        },
        getView(): GameView {
            return toView(state);
        },
        restart(): GameView {
            state = createInitialState(pickPlayer(), maxGuesses);
            return toView(state);
        },
        getPlayerId(): string {
            return state.player.id;
        },
    };
}
