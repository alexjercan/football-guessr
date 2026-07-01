import { applyGuess, createInitialState } from "./game";
import { GameMode, SavedGame, loadAllGames } from "./gameStorage";
import { StorageProvider, defaultStorage } from "./storage";
import { GameData, GameStatus, PlayerEntry } from "./types";

/**
 * Aggregated statistics for a single mode, all *derived* from the saved games
 * rather than tracked separately. Because outcomes are recomputed by replaying
 * each game's guesses through the same reducer the live game uses (see
 * {@link deriveOutcome}), these numbers can never drift out of sync with what
 * actually happened at the table.
 */
export interface GameStats {
    /** Total finished games recorded for this mode. */
    gamesPlayed: number;
    /** Games that ended in a win. */
    wins: number;
    /** Games that ended in a loss (ran out of guesses). */
    losses: number;
    /**
     * Length of the most recent unbroken run of wins, counting back from the
     * latest game. A single loss resets it to 0.
     *
     * For Daily this is a run of consecutive *calendar days* won — a skipped
     * day breaks the streak even if every day actually played was a win — so
     * it behaves like the familiar Wordle streak. For Practice it's simply the
     * number of consecutive winning plays at the end of the history.
     */
    currentStreak: number;
    /** The longest win streak ever achieved (same day/play rules as above). */
    longestStreak: number;
    /**
     * Mean guesses used across *winning* games only. Losses are excluded so a
     * few defeats don't silently inflate the "typical solve" figure. `0` when
     * there are no wins yet.
     */
    averageGuesses: number;
    /**
     * How many wins took exactly N guesses: `guessDistribution.get(3)` is the
     * number of games solved on the third guess. Keyed by guess count, so it's
     * ready to render as the "won in N" bar chart.
     */
    guessDistribution: Map<number, number>;
}

/** The outcome of one finished game, recovered by replaying its guesses. */
export interface GameOutcome {
    /** Final status after replay. Unfinished games surface as `"playing"`. */
    status: GameStatus;
    /** Guesses used to reach that status. */
    guessesUsed: number;
}

/**
 * Recover a finished game's outcome from its stored record by forcing its
 * target player and replaying the recorded guesses through the real reducer.
 *
 * This is the crux of the "no separate results log" design: we never persist
 * win/loss or guess counts, we re-derive them, so the stats are always exactly
 * what the recorded guesses imply. A record whose `playerId` no longer exists
 * in the current data set (e.g. a player was removed) is unresolvable and
 * returns `null` so the caller can skip it.
 */
export function deriveOutcome(
    game: SavedGame,
    players: PlayerEntry[]
): GameOutcome | null {
    const player = players.find((p) => p.id === game.playerId);
    if (!player) {
        return null;
    }

    let state = createInitialState(player);
    for (const guess of game.guesses) {
        state = applyGuess(state, guess);
    }

    return {
        status: state.status,
        guessesUsed: state.guesses.length,
    };
}

/**
 * The day-bucket a Daily game belongs to, as a `YYYY-MM-DD` string in UTC.
 *
 * A Daily `seed` is the packed UTC calendar day (`YYYYMMDD`, e.g. `20260701`),
 * so we can split it back into its parts without ever touching a `Date` and
 * without any timezone ambiguity. Practice seeds are timestamps and never flow
 * through here.
 */
function dailyDayKey(seed: number): string {
    const year = Math.floor(seed / 10000);
    const month = Math.floor((seed % 10000) / 100);
    const day = seed % 100;
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

/** Whole-day distance between two `YYYY-MM-DD` UTC day keys. */
function daysBetween(earlier: string, later: string): number {
    const a = Date.parse(`${earlier}T00:00:00Z`);
    const b = Date.parse(`${later}T00:00:00Z`);
    return Math.round((b - a) / 86_400_000);
}

/**
 * A single finished game reduced to just what the streak/aggregate math needs:
 * whether it was won, how many guesses it took, and (for Daily) which calendar
 * day it fell on. Sorted chronologically by the caller.
 */
interface FinishedGame {
    won: boolean;
    guessesUsed: number;
    /** UTC day key for Daily games; `null` for Practice. */
    dayKey: string | null;
}

/**
 * Compute current and longest win streaks over a chronologically-ordered list
 * of finished games.
 *
 * Practice: a streak is just a run of consecutive wins in play order.
 *
 * Daily: a streak is a run of consecutive *calendar days* that were won. Two
 * wins on adjacent days extend the streak; a gap of more than one day between
 * wins breaks it (a day you didn't play counts as a break), matching the usual
 * daily-puzzle behaviour. Multiple records for the same day collapse to one.
 */
function computeStreaks(games: FinishedGame[]): {
    currentStreak: number;
    longestStreak: number;
} {
    let longest = 0;
    let current = 0;
    let prevDayKey: string | null = null;

    for (const game of games) {
        if (!game.won) {
            // A loss ends any run.
            current = 0;
            prevDayKey = null;
            continue;
        }

        if (game.dayKey === null) {
            // Practice: every win just extends the run by one.
            current += 1;
        } else if (prevDayKey === null) {
            // First win of a fresh run.
            current = 1;
            prevDayKey = game.dayKey;
        } else {
            const gap = daysBetween(prevDayKey, game.dayKey);
            if (gap === 0) {
                // Same calendar day already counted — ignore the duplicate.
            } else if (gap === 1) {
                // Consecutive day: extend.
                current += 1;
                prevDayKey = game.dayKey;
            } else {
                // Missed one or more days: this win starts a new run.
                current = 1;
                prevDayKey = game.dayKey;
            }
        }

        if (current > longest) {
            longest = current;
        }
    }

    return { currentStreak: current, longestStreak: longest };
}

/**
 * Compute the full {@link GameStats} for one mode from stored games.
 *
 * Everything is derived: {@link loadAllGames} returns the mode's records in
 * chronological order (by seed), each is replayed via {@link deriveOutcome} to
 * recover its result, and the aggregates/streaks/distribution are rolled up
 * from those. Unfinished games (only possible for a mid-flight Daily save) and
 * records referencing an unknown player are skipped, so `gamesPlayed` reflects
 * genuinely completed games.
 */
export function computeGameStats(
    gameData: GameData,
    mode: GameMode,
    storage: StorageProvider = defaultStorage()
): GameStats {
    const saved = loadAllGames(mode, storage);

    const finished: FinishedGame[] = [];
    let wins = 0;
    let losses = 0;
    let winningGuessTotal = 0;
    const guessDistribution = new Map<number, number>();

    for (const game of saved) {
        const outcome = deriveOutcome(game, gameData.players);
        // Skip unresolved players and any game that isn't actually finished.
        if (!outcome || outcome.status === "playing") {
            continue;
        }

        const won = outcome.status === "won";
        if (won) {
            wins += 1;
            winningGuessTotal += outcome.guessesUsed;
            guessDistribution.set(
                outcome.guessesUsed,
                (guessDistribution.get(outcome.guessesUsed) ?? 0) + 1
            );
        } else {
            losses += 1;
        }

        finished.push({
            won,
            guessesUsed: outcome.guessesUsed,
            dayKey: mode === "daily" ? dailyDayKey(game.seed) : null,
        });
    }

    const { currentStreak, longestStreak } = computeStreaks(finished);

    return {
        gamesPlayed: wins + losses,
        wins,
        losses,
        currentStreak,
        longestStreak,
        averageGuesses: wins > 0 ? winningGuessTotal / wins : 0,
        guessDistribution,
    };
}
