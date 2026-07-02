export interface PlayerEntry {
    id: string;
    name: string;
    /**
     * Ordered club career, as display-name strings. The reducer reveals these
     * one at a time, so the game logic only ever needs the display names — the
     * loader resolves club ids (see {@link ClubMap}) back to these strings.
     */
    clubs: string[];
    /** Optional player portrait asset path; unset falls back gracefully (V3b). */
    photo?: string;
    /** Optional short player blurb; unset falls back gracefully (V3b). */
    description?: string;
}

export interface GameData {
    players: PlayerEntry[];
}

/**
 * A club as a referenceable entity. Keyed by a stable slug id in the
 * {@link ClubMap} (`clubs.json`); crest art (V3b) keys off that same id.
 * `crest`/`country` are optional and unset today — assets are deferred.
 */
export interface RawClub {
    name: string;
    country?: string;
    crest?: string;
}

/** Map of stable club id -> club entity (the `clubs` section of the data file). */
export type ClubMap = Record<string, RawClub>;

/**
 * A player as stored in the data file. The player id is the *key* in the
 * `players` map, so it is not repeated here. `clubs` are club *ids* (keys into
 * {@link ClubMap}); the loader resolves them to the display names
 * {@link PlayerEntry} exposes.
 */
export interface RawPlayer {
    name: string;
    clubs: string[];
    photo?: string;
    description?: string;
}

/**
 * The single committed dataset (`src/data/data.json`): players and clubs keyed
 * by their stable slug ids. A player references clubs by id; the loader looks
 * each id up in `clubs` to get the display name.
 */
export interface GameFile {
    players: Record<string, RawPlayer>;
    clubs: ClubMap;
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
