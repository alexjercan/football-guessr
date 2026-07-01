import { MemoryStorage } from "../src/storage";
import {
    SavedGame,
    gameKey,
    loadAllGames,
    loadGame,
    parseGameKey,
    saveGame,
} from "../src/gameStorage";

describe("key builders", () => {
    it("builds a unique game key per mode + seed", () => {
        expect(gameKey("daily", 20260701)).toBe("fcg:game:v2:daily:20260701");
        expect(gameKey("practice", 1782914573887)).toBe(
            "fcg:game:v2:practice:1782914573887"
        );
        // Same seed under different modes never collides.
        expect(gameKey("daily", 1)).not.toBe(gameKey("practice", 1));
        // Different seeds under the same mode never collide.
        expect(gameKey("daily", 20260701)).not.toBe(gameKey("daily", 20260702));
    });
});

describe("parseGameKey", () => {
    it("round-trips a key built by gameKey", () => {
        expect(parseGameKey(gameKey("daily", 20260701))).toEqual({
            mode: "daily",
            seed: 20260701,
        });
        expect(parseGameKey(gameKey("practice", 1782914573887))).toEqual({
            mode: "practice",
            seed: 1782914573887,
        });
    });

    it("rejects foreign keys sharing the same storage", () => {
        expect(parseGameKey("some.other.app:thing")).toBeNull();
        expect(parseGameKey("fcg:game:v1:daily:20260701")).toBeNull(); // old version
        expect(parseGameKey("fcg:stats:v2:daily")).toBeNull();
    });

    it("rejects an unknown mode", () => {
        expect(parseGameKey("fcg:game:v2:weekly:20260701")).toBeNull();
    });

    it("rejects a non-integer seed (never yields NaN)", () => {
        expect(parseGameKey("fcg:game:v2:daily:notanumber")).toBeNull();
        expect(parseGameKey("fcg:game:v2:daily:")).toBeNull();
        expect(parseGameKey("fcg:game:v2:daily")).toBeNull();
    });
});

describe("single game persistence", () => {
    const daily: SavedGame = {
        mode: "daily",
        seed: 20260701,
        playerId: "messi",
        guesses: ["Cristiano Ronaldo", "Lionel Messi"],
    };

    it("round-trips a saved game under its mode + seed", () => {
        const storage = new MemoryStorage();
        saveGame(daily, storage);
        expect(loadGame("daily", 20260701, storage)).toEqual(daily);
    });

    it("returns null when nothing is stored for the mode + seed", () => {
        const storage = new MemoryStorage();
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });

    it("keeps daily and practice with the same seed in separate slots", () => {
        const storage = new MemoryStorage();
        const practice: SavedGame = {
            mode: "practice",
            seed: 20260701,
            playerId: "mbappe",
            guesses: [],
        };
        saveGame(daily, storage);
        saveGame(practice, storage);
        expect(loadGame("daily", 20260701, storage)?.playerId).toBe("messi");
        expect(loadGame("practice", 20260701, storage)?.playerId).toBe(
            "mbappe"
        );
    });

    it("overwrites the same slot in place (in-progress daily save)", () => {
        const storage = new MemoryStorage();
        saveGame({ ...daily, guesses: ["Neymar Jr"] }, storage);
        saveGame(
            { ...daily, guesses: ["Neymar Jr", "Cristiano Ronaldo"] },
            storage
        );
        expect(loadGame("daily", 20260701, storage)?.guesses).toEqual([
            "Neymar Jr",
            "Cristiano Ronaldo",
        ]);
    });

    it("ignores a game saved under a different (stale) seed", () => {
        const storage = new MemoryStorage();
        saveGame(daily, storage);
        expect(loadGame("daily", 20260702, storage)).toBeNull();
    });

    it("returns null for corrupt JSON", () => {
        const storage = new MemoryStorage();
        storage.setItem(gameKey("daily", 20260701), "{not json");
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });

    it("returns null when the stored JSON is literally null", () => {
        const storage = new MemoryStorage();
        storage.setItem(gameKey("daily", 20260701), "null");
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });

    it("returns null for structurally-invalid saved data", () => {
        const storage = new MemoryStorage();
        storage.setItem(
            gameKey("daily", 20260701),
            JSON.stringify({ mode: "daily", seed: 20260701, guesses: "nope" })
        );
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });

    it("rejects a payload whose embedded seed mismatches the key", () => {
        const storage = new MemoryStorage();
        storage.setItem(
            gameKey("daily", 20260701),
            JSON.stringify({ ...daily, seed: 19990101 })
        );
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });

    it("rejects a payload whose embedded mode mismatches the key", () => {
        const storage = new MemoryStorage();
        storage.setItem(
            gameKey("daily", 20260701),
            JSON.stringify({ ...daily, mode: "practice" })
        );
        expect(loadGame("daily", 20260701, storage)).toBeNull();
    });
});

describe("loadAllGames (runtime aggregation)", () => {
    it("starts empty for both modes", () => {
        const storage = new MemoryStorage();
        expect(loadAllGames("daily", storage)).toEqual([]);
        expect(loadAllGames("practice", storage)).toEqual([]);
    });

    it("collects only the requested mode's games", () => {
        const storage = new MemoryStorage();
        saveGame(
            { mode: "daily", seed: 20260701, playerId: "messi", guesses: [] },
            storage
        );
        saveGame(
            {
                mode: "practice",
                seed: 1782914573887,
                playerId: "mbappe",
                guesses: ["Lionel Messi"],
            },
            storage
        );
        expect(loadAllGames("daily", storage)).toHaveLength(1);
        expect(loadAllGames("practice", storage)).toHaveLength(1);
        expect(loadAllGames("daily", storage)[0].playerId).toBe("messi");
    });

    it("returns games sorted by seed ascending (chronological)", () => {
        const storage = new MemoryStorage();
        // Insert out of order; expect ascending by seed on read.
        saveGame(
            { mode: "daily", seed: 20260703, playerId: "c", guesses: [] },
            storage
        );
        saveGame(
            { mode: "daily", seed: 20260701, playerId: "a", guesses: [] },
            storage
        );
        saveGame(
            { mode: "daily", seed: 20260702, playerId: "b", guesses: [] },
            storage
        );
        expect(loadAllGames("daily", storage).map((g) => g.seed)).toEqual([
            20260701, 20260702, 20260703,
        ]);
    });

    it("ignores foreign keys and corrupt entries", () => {
        const storage = new MemoryStorage();
        saveGame(
            { mode: "daily", seed: 20260701, playerId: "messi", guesses: [] },
            storage
        );
        // Noise that must be skipped by the aggregator.
        storage.setItem("some.other.app:key", "whatever");
        storage.setItem(gameKey("daily", 20260702), "{corrupt");
        storage.setItem("fcg:game:v2:daily:notanumber", JSON.stringify({}));
        const games = loadAllGames("daily", storage);
        expect(games).toHaveLength(1);
        expect(games[0].playerId).toBe("messi");
    });

    it("supports deriving stats: each play is its own record", () => {
        // Practice writes one record per finished play (distinct timestamps),
        // so the count reflects games played without any dedupe/append blob.
        const storage = new MemoryStorage();
        saveGame(
            { mode: "practice", seed: 1000, playerId: "a", guesses: ["x"] },
            storage
        );
        saveGame(
            { mode: "practice", seed: 2000, playerId: "b", guesses: ["y"] },
            storage
        );
        expect(loadAllGames("practice", storage).map((g) => g.seed)).toEqual([
            1000, 2000,
        ]);
    });
});
