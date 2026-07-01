export interface PlayerEntry {
    id: string;
    name: string;
    clubs: string[];
}

export interface GameData {
    players: PlayerEntry[];
}

/** Lifecycle of a single game. */
export type GameStatus = "playing" | "won" | "lost";

/**
 * Internal, framework-agnostic game state. This is the source of truth
 * mutated by the reducer; the UI should read {@link GameView} instead.
 */
export interface GameState {
    /** The player the user is trying to guess. */
    player: PlayerEntry;
    /** How many of the target's clubs are currently revealed (>= 1). */
    revealedCount: number;
    /** Every non-empty guess made, in order (trimmed). */
    guesses: string[];
    /** Maximum number of guesses allowed before losing. */
    maxGuesses: number;
    /** Current lifecycle status. */
    status: GameStatus;
}

/**
 * Read-only projection of {@link GameState} for the UI. The target player's
 * name is only exposed via `answer` once the game has ended.
 */
export interface GameView {
    /** Clubs revealed so far, in chronological order. */
    revealedClubs: string[];
    /** Number of guesses used. */
    guessesUsed: number;
    /** Guesses left before the game is lost (never negative). */
    guessesRemaining: number;
    /** Maximum number of guesses allowed. */
    maxGuesses: number;
    /** Current lifecycle status. */
    status: GameStatus;
    /** True once every club has been revealed (no new hints remain). */
    outOfHints: boolean;
    /** Every non-empty guess made, in order. */
    pastGuesses: string[];
    /** The target player's name, only once the game is over; otherwise null. */
    answer: string | null;
}
