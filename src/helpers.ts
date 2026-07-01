import { PlayerEntry } from "./types";

export function chooseRandomPlayer(
    seed: number,
    players: PlayerEntry[]
): PlayerEntry {
    const randomIndex = Math.floor(seed * players.length);
    return players[randomIndex];
}

/**
 * Mulberry32 — a tiny, fast, deterministic pseudo-random number generator.
 *
 * Given a 32-bit integer seed it returns a function that yields a repeatable
 * sequence of numbers in the half-open interval [0, 1). The same seed always
 * produces the same sequence, which is what lets the Daily puzzle pick the
 * same player for everyone.
 */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function (): number {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Derive a stable integer seed from a date's UTC calendar day (YYYYMMDD), so
 * the Daily puzzle is identical worldwide regardless of the player's timezone.
 */
export function dateToSeed(date: Date): number {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // getUTCMonth is 0-indexed
    const day = date.getUTCDate();
    return year * 10000 + month * 100 + day;
}
