import {
    findMatches,
    fuzzyMatchScore,
    resolveGuess,
} from "../src/matching";
import { normalizeName } from "../src/matching";

/** The real starter roster, so the examples in the task map 1:1. */
const PLAYER_NAMES = [
    "Neymar Jr",
    "Lionel Messi",
    "Cristiano Ronaldo",
    "Kylian Mbappé",
];

const names = (query: string, exclude: string[] = []): string[] =>
    findMatches(PLAYER_NAMES, query, exclude).map((m) => m.name);

describe("fuzzyMatchScore", () => {
    it("scores an exact (normalized) match highest", () => {
        expect(fuzzyMatchScore("lionel messi", "lionel messi")).toBeGreaterThan(
            fuzzyMatchScore("lionel", "lionel messi")
        );
    });

    it("ranks prefix above substring above subsequence", () => {
        const prefix = fuzzyMatchScore("lio", "lionel messi");
        const substring = fuzzyMatchScore("nel", "lionel messi");
        const subsequence = fuzzyMatchScore("lms", "lionel messi");
        expect(prefix).toBeGreaterThan(substring);
        expect(substring).toBeGreaterThan(subsequence);
        expect(subsequence).toBeGreaterThan(0);
    });

    it("returns 0 when the query is not even a subsequence", () => {
        expect(fuzzyMatchScore("messss", "lionel messi")).toBe(0);
        expect(fuzzyMatchScore("xyz", "lionel messi")).toBe(0);
    });

    it("returns 0 for an empty query", () => {
        expect(fuzzyMatchScore("", "lionel messi")).toBe(0);
    });

    it("prefers the shorter candidate on an otherwise-equal tier", () => {
        // Both start with "m"; the shorter name should edge ahead.
        expect(fuzzyMatchScore("m", "messi")).toBeGreaterThan(
            fuzzyMatchScore("m", "messiiiii")
        );
    });
});

describe("findMatches — the task's worked examples", () => {
    it('"Messi" resolves to Lionel Messi', () => {
        expect(names("Messi")).toContain("Lionel Messi");
        expect(names("Messi")[0]).toBe("Lionel Messi");
    });

    it('"LMess" fuzzy-matches Lionel Messi (subsequence)', () => {
        expect(names("LMess")).toContain("Lionel Messi");
    });

    it('"Messss" matches no one (rejected as invalid)', () => {
        expect(names("Messss")).toEqual([]);
    });

    it('"Mbappe" (no accent) matches Kylian Mbappé', () => {
        expect(names("Mbappe")).toContain("Kylian Mbappé");
    });

    it('lowercase "mbappe" matches Kylian Mbappé (normalized)', () => {
        expect(names("mbappe")).toContain("Kylian Mbappé");
    });

    it("a plain prefix on the given name works too", () => {
        expect(names("Kylian")[0]).toBe("Kylian Mbappé");
    });
});

describe("findMatches — general behavior", () => {
    it("returns nothing for an empty or whitespace-only query", () => {
        expect(names("")).toEqual([]);
        expect(names("   ")).toEqual([]);
    });

    it("orders results best-first", () => {
        // "ronaldo" is a substring only of Cristiano Ronaldo.
        expect(names("ronaldo")[0]).toBe("Cristiano Ronaldo");
    });

    it("can match on a surname the display name buries mid-string", () => {
        expect(names("Jr")).toContain("Neymar Jr");
    });

    it("excludes already-guessed names (accent/case-insensitive)", () => {
        // Exclude via a differently-cased, unaccented spelling.
        expect(names("Mbappe", ["kylian mbappe"])).toEqual([]);
    });

    it("keeps other matches when only some are excluded", () => {
        const result = names("a", ["Lionel Messi"]);
        expect(result).not.toContain("Lionel Messi");
        // "a" is a subsequence of several remaining names.
        expect(result.length).toBeGreaterThan(0);
    });

    it("is a pure function of its inputs (no mutation of the name list)", () => {
        const input = [...PLAYER_NAMES];
        findMatches(input, "messi");
        expect(input).toEqual(PLAYER_NAMES);
    });
});

describe("resolveGuess", () => {
    it("returns the single best real name for a valid fuzzy query", () => {
        expect(resolveGuess(PLAYER_NAMES, "Messi")).toBe("Lionel Messi");
        expect(resolveGuess(PLAYER_NAMES, "LMess")).toBe("Lionel Messi");
        expect(resolveGuess(PLAYER_NAMES, "mbappe")).toBe("Kylian Mbappé");
    });

    it("returns null when nothing matches (invalid input is rejected)", () => {
        expect(resolveGuess(PLAYER_NAMES, "Messss")).toBeNull();
        expect(resolveGuess(PLAYER_NAMES, "")).toBeNull();
    });

    it("skips an already-guessed name and returns null if it was the only match", () => {
        expect(resolveGuess(PLAYER_NAMES, "Messi", ["Lionel Messi"])).toBeNull();
    });

    it("normalizes the resolved name to a real dataset spelling", () => {
        // Input has no accent; the returned name is the canonical accented one.
        expect(normalizeName(resolveGuess(PLAYER_NAMES, "Mbappe") ?? "")).toBe(
            "kylian mbappe"
        );
    });
});
