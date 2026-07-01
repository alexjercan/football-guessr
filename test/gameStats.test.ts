import { MemoryStorage } from "../src/storage";
import { saveGame, SavedGame } from "../src/gameStorage";
import {
    computeGameStats,
    deriveOutcome,
    GameOutcome,
} from "../src/gameStats";
import { GameData, PlayerEntry } from "../src/types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                    */
/* -------------------------------------------------------------------------- */

const messi: PlayerEntry = {
    id: "messi",
    name: "Lionel Messi",
    clubs: ["Barcelona", "Paris Saint-Germain", "Inter Miami"],
};
const ronaldo: PlayerEntry = {
    id: "ronaldo",
    name: "Cristiano Ronaldo",
    clubs: ["Sporting CP", "Manchester United", "Real Madrid", "Al-Nassr"],
};
const mbappe: PlayerEntry = {
    id: "mbappe",
    name: "Kylian Mbappé",
    clubs: ["AS Monaco", "Paris Saint-Germain", "Real Madrid"],
};

const gameData: GameData = { players: [messi, ronaldo, mbappe] };

/** A win in N guesses: N-1 wrong names, then the correct one. */
function winIn(target: PlayerEntry, guesses: number): string[] {
    const wrong = gameData.players.filter((p) => p.id !== target.id);
    const out: string[] = [];
    for (let i = 0; i < guesses - 1; i++) {
        out.push(wrong[i % wrong.length].name);
    }
    out.push(target.name);
    return out;
}

/** A loss: fill all 25 guesses with wrong (but valid) names. */
function loss(target: PlayerEntry): string[] {
    const wrong = gameData.players.filter((p) => p.id !== target.id);
    const out: string[] = [];
    for (let i = 0; i < 25; i++) {
        out.push(wrong[i % wrong.length].name);
    }
    return out;
}

/** Packed UTC-day seed (YYYYMMDD) for a Daily game. */
function daySeed(year: number, month: number, day: number): number {
    return year * 10000 + month * 100 + day;
}

/* -------------------------------------------------------------------------- */
/* deriveOutcome                                                               */
/* -------------------------------------------------------------------------- */

describe("deriveOutcome", () => {
    it("recovers a win and its guess count by replaying guesses", () => {
        const game: SavedGame = {
            mode: "practice",
            seed: 1000,
            playerId: "messi",
            guesses: winIn(messi, 3),
        };
        expect(deriveOutcome(game, gameData.players)).toEqual<GameOutcome>({
            status: "won",
            guessesUsed: 3,
        });
    });

    it("recovers a loss once all guesses are exhausted", () => {
        const game: SavedGame = {
            mode: "practice",
            seed: 1000,
            playerId: "messi",
            guesses: loss(messi),
        };
        expect(deriveOutcome(game, gameData.players)).toEqual<GameOutcome>({
            status: "lost",
            guessesUsed: 25,
        });
    });

    it("reports an unfinished game as still playing", () => {
        const game: SavedGame = {
            mode: "daily",
            seed: daySeed(2026, 7, 1),
            playerId: "messi",
            guesses: [ronaldo.name], // one wrong guess, game continues
        };
        expect(deriveOutcome(game, gameData.players)).toEqual<GameOutcome>({
            status: "playing",
            guessesUsed: 1,
        });
    });

    it("matches accent-insensitively when replaying", () => {
        const game: SavedGame = {
            mode: "practice",
            seed: 1000,
            playerId: "mbappe",
            guesses: ["Kylian Mbappe"], // no accent
        };
        expect(deriveOutcome(game, gameData.players)?.status).toBe("won");
    });

    it("returns null for a record referencing an unknown player", () => {
        const game: SavedGame = {
            mode: "practice",
            seed: 1000,
            playerId: "ghost",
            guesses: [],
        };
        expect(deriveOutcome(game, gameData.players)).toBeNull();
    });
});

/* -------------------------------------------------------------------------- */
/* computeGameStats — aggregates                                               */
/* -------------------------------------------------------------------------- */

describe("computeGameStats: aggregates", () => {
    it("returns an empty-but-valid shape when there are no games", () => {
        const storage = new MemoryStorage();
        const stats = computeGameStats(gameData, "daily", storage);
        expect(stats).toEqual({
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            currentStreak: 0,
            longestStreak: 0,
            averageGuesses: 0,
            guessDistribution: new Map(),
        });
    });

    it("counts wins and losses and ignores the other mode", () => {
        const storage = new MemoryStorage();
        saveGame(
            { mode: "practice", seed: 1, playerId: "messi", guesses: winIn(messi, 2) },
            storage
        );
        saveGame(
            { mode: "practice", seed: 2, playerId: "ronaldo", guesses: loss(ronaldo) },
            storage
        );
        // A daily game that must NOT leak into practice stats.
        saveGame(
            {
                mode: "daily",
                seed: daySeed(2026, 7, 1),
                playerId: "mbappe",
                guesses: winIn(mbappe, 1),
            },
            storage
        );

        const stats = computeGameStats(gameData, "practice", storage);
        expect(stats.gamesPlayed).toBe(2);
        expect(stats.wins).toBe(1);
        expect(stats.losses).toBe(1);
    });

    it("excludes unfinished (still-playing) games from the counts", () => {
        const storage = new MemoryStorage();
        saveGame(
            {
                mode: "daily",
                seed: daySeed(2026, 7, 1),
                playerId: "messi",
                guesses: [ronaldo.name], // in progress
            },
            storage
        );
        const stats = computeGameStats(gameData, "daily", storage);
        expect(stats.gamesPlayed).toBe(0);
    });

    it("averages guesses over wins only, excluding losses", () => {
        const storage = new MemoryStorage();
        saveGame(
            { mode: "practice", seed: 1, playerId: "messi", guesses: winIn(messi, 2) },
            storage
        );
        saveGame(
            { mode: "practice", seed: 2, playerId: "ronaldo", guesses: winIn(ronaldo, 4) },
            storage
        );
        // A loss should not drag the average down.
        saveGame(
            { mode: "practice", seed: 3, playerId: "mbappe", guesses: loss(mbappe) },
            storage
        );

        const stats = computeGameStats(gameData, "practice", storage);
        expect(stats.averageGuesses).toBe(3); // (2 + 4) / 2
    });

    it("builds a guess distribution keyed by guess count", () => {
        const storage = new MemoryStorage();
        saveGame(
            { mode: "practice", seed: 1, playerId: "messi", guesses: winIn(messi, 2) },
            storage
        );
        saveGame(
            { mode: "practice", seed: 2, playerId: "ronaldo", guesses: winIn(ronaldo, 2) },
            storage
        );
        saveGame(
            { mode: "practice", seed: 3, playerId: "mbappe", guesses: winIn(mbappe, 5) },
            storage
        );

        const stats = computeGameStats(gameData, "practice", storage);
        expect(stats.guessDistribution.get(2)).toBe(2);
        expect(stats.guessDistribution.get(5)).toBe(1);
        expect(stats.guessDistribution.has(3)).toBe(false);
    });
});

/* -------------------------------------------------------------------------- */
/* computeGameStats — streaks                                                  */
/* -------------------------------------------------------------------------- */

describe("computeGameStats: practice streaks", () => {
    it("counts consecutive wins as the streak", () => {
        const storage = new MemoryStorage();
        [messi, ronaldo, mbappe].forEach((p, i) =>
            saveGame(
                { mode: "practice", seed: i + 1, playerId: p.id, guesses: winIn(p, 2) },
                storage
            )
        );
        const stats = computeGameStats(gameData, "practice", storage);
        expect(stats.currentStreak).toBe(3);
        expect(stats.longestStreak).toBe(3);
    });

    it("resets the current streak after a loss but keeps the longest", () => {
        const storage = new MemoryStorage();
        // win, win, loss, win  (seed order == play order)
        saveGame({ mode: "practice", seed: 1, playerId: "messi", guesses: winIn(messi, 2) }, storage);
        saveGame({ mode: "practice", seed: 2, playerId: "ronaldo", guesses: winIn(ronaldo, 2) }, storage);
        saveGame({ mode: "practice", seed: 3, playerId: "mbappe", guesses: loss(mbappe) }, storage);
        saveGame({ mode: "practice", seed: 4, playerId: "messi", guesses: winIn(messi, 2) }, storage);

        const stats = computeGameStats(gameData, "practice", storage);
        expect(stats.currentStreak).toBe(1);
        expect(stats.longestStreak).toBe(2);
    });
});

describe("computeGameStats: daily streaks (by calendar day)", () => {
    it("extends across consecutive days", () => {
        const storage = new MemoryStorage();
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 1), playerId: "messi", guesses: winIn(messi, 2) }, storage);
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 2), playerId: "ronaldo", guesses: winIn(ronaldo, 3) }, storage);
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 3), playerId: "mbappe", guesses: winIn(mbappe, 1) }, storage);

        const stats = computeGameStats(gameData, "daily", storage);
        expect(stats.currentStreak).toBe(3);
        expect(stats.longestStreak).toBe(3);
    });

    it("breaks the streak when a day is skipped", () => {
        const storage = new MemoryStorage();
        // Jul 1 and Jul 2 won, then a gap, then Jul 5 won.
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 1), playerId: "messi", guesses: winIn(messi, 2) }, storage);
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 2), playerId: "ronaldo", guesses: winIn(ronaldo, 2) }, storage);
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 5), playerId: "mbappe", guesses: winIn(mbappe, 2) }, storage);

        const stats = computeGameStats(gameData, "daily", storage);
        expect(stats.currentStreak).toBe(1); // only Jul 5
        expect(stats.longestStreak).toBe(2); // Jul 1 -> Jul 2
    });

    it("bridges a month boundary correctly", () => {
        const storage = new MemoryStorage();
        saveGame({ mode: "daily", seed: daySeed(2026, 7, 31), playerId: "messi", guesses: winIn(messi, 2) }, storage);
        saveGame({ mode: "daily", seed: daySeed(2026, 8, 1), playerId: "ronaldo", guesses: winIn(ronaldo, 2) }, storage);

        const stats = computeGameStats(gameData, "daily", storage);
        expect(stats.currentStreak).toBe(2);
    });
});
