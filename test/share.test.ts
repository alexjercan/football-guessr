import {
    ShareResult,
    buildShareGrid,
    buildShareHeadline,
    buildShareText,
} from "../src/share";

/** Base result used by the tests; each case overrides just what it needs. */
function result(overrides: Partial<ShareResult> = {}): ShareResult {
    return {
        mode: "daily",
        won: true,
        guessesUsed: 4,
        maxGuesses: 25,
        puzzleNumber: 14,
        ...overrides,
    };
}

describe("buildShareHeadline", () => {
    it("shows the Daily puzzle number and the score fraction on a win", () => {
        expect(buildShareHeadline(result())).toBe(
            "⚽ Football Guessr — Daily #14 — 4/25"
        );
    });

    it("uses 'X' for the score on a loss", () => {
        expect(
            buildShareHeadline(result({ won: false, guessesUsed: 25 }))
        ).toBe("⚽ Football Guessr — Daily #14 — X/25");
    });

    it("labels practice mode without a puzzle number", () => {
        expect(
            buildShareHeadline(
                result({ mode: "practice", puzzleNumber: undefined })
            )
        ).toBe("⚽ Football Guessr — Practice — 4/25");
    });

    it("falls back to bare 'Daily' when no puzzle number is supplied", () => {
        expect(buildShareHeadline(result({ puzzleNumber: undefined }))).toBe(
            "⚽ Football Guessr — Daily — 4/25"
        );
    });

    it("never contains the answer (spoiler-free by construction)", () => {
        // The result carries no answer field at all, so there's nothing to leak.
        const headline = buildShareHeadline(result());
        expect(headline).not.toMatch(/messi|ronaldo|mbapp/i);
    });
});

describe("buildShareGrid", () => {
    it("puts one red square per wrong guess and a green for the win", () => {
        // 4 guesses to win => 3 wrong + 1 correct.
        expect(buildShareGrid(result({ guessesUsed: 4 }))).toBe("🟥🟥🟥🟩");
    });

    it("is a single green square for a first-guess win", () => {
        expect(buildShareGrid(result({ guessesUsed: 1 }))).toBe("🟩");
    });

    it("has no green square on a loss (all red)", () => {
        expect(buildShareGrid(result({ won: false, guessesUsed: 3 }))).toBe(
            "🟥🟥🟥"
        );
    });

    it("wraps into rows of five squares", () => {
        // 7-guess win => 6 wrong + 1 correct = 7 squares => 5 + 2.
        expect(buildShareGrid(result({ guessesUsed: 7 }))).toBe(
            "🟥🟥🟥🟥🟥\n🟥🟩"
        );
    });

    it("wraps a maxed-out loss into full rows", () => {
        // 25 wrong guesses => five rows of five reds.
        const grid = buildShareGrid(result({ won: false, guessesUsed: 25 }));
        expect(grid.split("\n")).toHaveLength(5);
        expect(grid.split("\n").every((row) => row === "🟥🟥🟥🟥🟥")).toBe(
            true
        );
    });

    it("only ever uses plain unicode squares (no logos/crests)", () => {
        const grid = buildShareGrid(result({ guessesUsed: 5 }));
        // Strip the two allowed squares and newlines; nothing should remain.
        expect(grid.replace(/[🟥🟩\n]/gu, "")).toBe("");
    });
});

describe("buildShareText", () => {
    it("joins the headline and grid with a blank line", () => {
        expect(buildShareText(result({ guessesUsed: 4 }))).toBe(
            "⚽ Football Guessr — Daily #14 — 4/25\n\n🟥🟥🟥🟩"
        );
    });

    it("composes a practice loss correctly", () => {
        expect(
            buildShareText(
                result({
                    mode: "practice",
                    puzzleNumber: undefined,
                    won: false,
                    guessesUsed: 2,
                })
            )
        ).toBe("⚽ Football Guessr — Practice — X/25\n\n🟥🟥");
    });

    it("omits the grid (no trailing blank) when there are zero squares", () => {
        // Degenerate guard: a loss with zero guesses has an empty grid.
        expect(buildShareText(result({ won: false, guessesUsed: 0 }))).toBe(
            "⚽ Football Guessr — Daily #14 — X/25"
        );
    });
});
