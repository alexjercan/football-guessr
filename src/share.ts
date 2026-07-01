/**
 * Pure builders for the "share your result" text — the Wordle-style summary a
 * player can copy to the clipboard once a game ends. Kept DOM-free and
 * side-effect-free so it's unit-testable; the actual clipboard write and button
 * wiring live in `ui/modal.ts`.
 *
 * Spoiler rule: the summary never contains the answer, and it uses only plain
 * Unicode squares — no club crests, logos, or copyrighted marks (see the V2
 * task notes).
 */

/** Green square: the winning guess. */
const CORRECT_SQUARE = "🟩";
/** Red square: a wrong guess. */
const WRONG_SQUARE = "🟥";
/** How many squares per line before wrapping (keeps a long loss readable). */
const SQUARES_PER_ROW = 5;

/** Everything the share text needs, derived from the finished game. */
export interface ShareResult {
    /** Which mode was played — picks the "Daily #N" vs "Practice" heading. */
    mode: "daily" | "practice";
    /** Whether the game was won. `false` means the guesses ran out. */
    won: boolean;
    /**
     * Total guesses made. On a win this includes the correct final guess; on a
     * loss it's the number of wrong guesses (== the guess limit).
     */
    guessesUsed: number;
    /** The guess limit, for the "N/M" fraction. */
    maxGuesses: number;
    /** The Daily puzzle number, when {@link mode} is `"daily"`. */
    puzzleNumber?: number;
}

/**
 * The first line: the title plus the mode/puzzle and the score fraction, e.g.
 *   `⚽ Football Guessr — Daily #14 — 4/25`
 *   `⚽ Football Guessr — Practice — X/25`
 * A loss shows `X` instead of a number (it wasn't solved).
 */
export function buildShareHeadline(result: ShareResult): string {
    const modeLabel =
        result.mode === "daily"
            ? result.puzzleNumber
                ? `Daily #${result.puzzleNumber}`
                : "Daily"
            : "Practice";
    const score = result.won ? String(result.guessesUsed) : "X";
    return `⚽ Football Guessr — ${modeLabel} — ${score}/${result.maxGuesses}`;
}

/**
 * The emoji grid: one square per guess, in order. Every wrong guess is 🟥; on a
 * win the final (correct) guess is 🟩. A loss is all 🟥. Rows wrap every
 * {@link SQUARES_PER_ROW} squares so a long game doesn't become one giant line.
 *
 * Guess accounting: on a win, `guessesUsed` counts the correct guess too, so
 * there are `guessesUsed - 1` wrong squares plus one green. On a loss, all
 * `guessesUsed` guesses were wrong.
 */
export function buildShareGrid(result: ShareResult): string {
    const wrongCount = result.won
        ? Math.max(0, result.guessesUsed - 1)
        : result.guessesUsed;

    const squares: string[] = [];
    for (let i = 0; i < wrongCount; i++) {
        squares.push(WRONG_SQUARE);
    }
    if (result.won) {
        squares.push(CORRECT_SQUARE);
    }

    // Chunk into rows for readability.
    const rows: string[] = [];
    for (let i = 0; i < squares.length; i += SQUARES_PER_ROW) {
        rows.push(squares.slice(i, i + SQUARES_PER_ROW).join(""));
    }
    return rows.join("\n");
}

/**
 * The full shareable text: headline, a blank line, then the emoji grid. This is
 * what gets copied to the clipboard.
 */
export function buildShareText(result: ShareResult): string {
    const grid = buildShareGrid(result);
    const headline = buildShareHeadline(result);
    // A grid is always non-empty in practice (a finished game has >= 1 guess),
    // but guard anyway so a zero-guess edge case doesn't leave a trailing blank.
    return grid ? `${headline}\n\n${grid}` : headline;
}
