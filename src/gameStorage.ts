import { StorageProvider, defaultStorage } from "./storage";

/**
 * Persistence facade for saved games, layered over a {@link StorageProvider}.
 *
 * Every game is stored as its own key/value entry — an individual
 * {@link SavedGame} record — rather than as one big array. The full list is
 * reconstructed at runtime by {@link loadAllGames}, which enumerates the
 * matching keys. This keeps writes cheap and independent (finishing one game
 * never has to read-modify-write a shared blob) and makes each game trivially
 * inspectable/removable on its own.
 *
 * A record is deliberately minimal: `{ seed, playerId, guesses }`. Everything
 * else a stats page cares about — win/loss, guesses used, the guess
 * distribution — is *derived* by replaying `guesses` against the target
 * player's clubs, so it can never drift out of sync with the actual game.
 *
 * Keys are namespaced (`fcg:`) and versioned (`v2`) so a future schema change
 * can bump the version without colliding with data written by an older build.
 */

const NS = "fcg";
const VERSION = "v2";
const GAME_PREFIX = `${NS}:game:${VERSION}`;

export type GameMode = "daily" | "practice";

/* -------------------------------------------------------------------------- */
/* Keys                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Key for a single saved game, scoped by mode and its `seed`.
 *
 * The seed is what makes each game addressable:
 *   - Daily: a distinct integer per UTC calendar day, so each day owns exactly
 *     one slot (an in-progress save is overwritten in place; yesterday's game
 *     is a different key and is never touched).
 *   - Practice: the epoch-ms timestamp the game was played at, so every play
 *     is its own slot and doubles as a "played at" clock for ordering.
 */
export function gameKey(mode: GameMode, seed: number): string {
    return `${GAME_PREFIX}:${mode}:${seed}`;
}

/**
 * Parse a storage key back into its `{ mode, seed }`, or `null` if the key
 * isn't one of ours (foreign keys sharing the same localStorage are ignored).
 */
export function parseGameKey(
    key: string
): { mode: GameMode; seed: number } | null {
    const prefix = `${GAME_PREFIX}:`;
    if (!key.startsWith(prefix)) {
        return null;
    }
    const rest = key.slice(prefix.length);
    const sep = rest.indexOf(":");
    if (sep === -1) {
        return null;
    }
    const mode = rest.slice(0, sep);
    const seedText = rest.slice(sep + 1);
    if (mode !== "daily" && mode !== "practice") {
        return null;
    }
    // Reject anything non-integer so a malformed key can't yield NaN seeds.
    if (!/^\d+$/.test(seedText)) {
        return null;
    }
    return { mode, seed: Number(seedText) };
}

/* -------------------------------------------------------------------------- */
/* Saved game                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The persisted shape of a single game. We keep the `playerId` (the answer) so
 * the game can be rebuilt on load — force that player, then replay `guesses`
 * through the reducer — and so a stats page can derive the outcome the same way
 * without a separate, drift-prone results log.
 */
export interface SavedGame {
    /** Which mode this game belongs to. */
    mode: GameMode;
    /**
     * The game's seed: the UTC-day integer for Daily, or the epoch-ms
     * timestamp it was played at for Practice. Also the key discriminator.
     */
    seed: number;
    /** Id of the target player, so the same game can be reconstructed. */
    playerId: string;
    /** Guesses made so far, in order (canonical, resolved names). */
    guesses: string[];
}

function isSavedGame(value: unknown): value is SavedGame {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return (
        (v.mode === "daily" || v.mode === "practice") &&
        typeof v.seed === "number" &&
        typeof v.playerId === "string" &&
        Array.isArray(v.guesses) &&
        v.guesses.every((g) => typeof g === "string")
    );
}

/**
 * Load a single saved game by mode + seed, or `null` if there's nothing valid
 * stored. A payload whose embedded `mode`/`seed` disagree with the requested
 * key is rejected (treated as absent) rather than trusted.
 */
export function loadGame(
    mode: GameMode,
    seed: number,
    storage: StorageProvider = defaultStorage()
): SavedGame | null {
    const raw = storage.getItem(gameKey(mode, seed));
    if (raw === null) {
        return null;
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }
    if (!isSavedGame(parsed) || parsed.mode !== mode || parsed.seed !== seed) {
        return null;
    }
    return parsed;
}

/** Persist a single game (overwrites the mode+seed slot in place). */
export function saveGame(
    game: SavedGame,
    storage: StorageProvider = defaultStorage()
): void {
    storage.setItem(gameKey(game.mode, game.seed), JSON.stringify(game));
}

/**
 * Rebuild the full list of saved games for a mode at runtime by enumerating the
 * matching keys. Order is not guaranteed by storage, so results are sorted by
 * `seed` ascending — which for both modes is chronological (day number for
 * Daily, timestamp for Practice). Corrupt or foreign entries are skipped.
 */
export function loadAllGames(
    mode: GameMode,
    storage: StorageProvider = defaultStorage()
): SavedGame[] {
    const games: SavedGame[] = [];
    for (const key of storage.keys()) {
        const parsed = parseGameKey(key);
        if (parsed === null || parsed.mode !== mode) {
            continue;
        }
        const game = loadGame(parsed.mode, parsed.seed, storage);
        if (game !== null) {
            games.push(game);
        }
    }
    games.sort((a, b) => a.seed - b.seed);
    return games;
}
