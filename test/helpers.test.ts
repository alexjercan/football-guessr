import { mulberry32, dateToSeed } from "../src/helpers";

describe("mulberry32", () => {
    it("is deterministic: the same seed yields the same sequence", () => {
        const a = mulberry32(123456);
        const b = mulberry32(123456);
        const seqA = [a(), a(), a(), a(), a()];
        const seqB = [b(), b(), b(), b(), b()];
        expect(seqA).toEqual(seqB);
    });

    it("produces different sequences for different seeds", () => {
        const a = mulberry32(1);
        const b = mulberry32(2);
        expect(a()).not.toEqual(b());
    });

    it("returns values within the half-open interval [0, 1)", () => {
        const rng = mulberry32(42);
        for (let i = 0; i < 1000; i++) {
            const value = rng();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it("handles a zero seed deterministically", () => {
        const a = mulberry32(0);
        const b = mulberry32(0);
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it("advances the sequence on each call (successive values differ)", () => {
        const rng = mulberry32(7);
        const first = rng();
        const second = rng();
        expect(first).not.toEqual(second);
    });
});

describe("dateToSeed", () => {
    it("produces the expected YYYYMMDD seed for a fixed date", () => {
        expect(dateToSeed(new Date("2026-07-01T00:00:00Z"))).toBe(20260701);
    });

    it("is stable across every instant within the same UTC day", () => {
        const startOfDay = dateToSeed(new Date("2026-07-01T00:00:00Z"));
        const endOfDay = dateToSeed(new Date("2026-07-01T23:59:59.999Z"));
        expect(startOfDay).toBe(endOfDay);
        expect(startOfDay).toBe(20260701);
    });

    it("is UTC-based so the same UTC calendar day maps to one seed", () => {
        // Two different instants that both fall on 2026-07-01 in UTC.
        const morning = dateToSeed(new Date("2026-07-01T02:30:00Z"));
        const evening = dateToSeed(new Date("2026-07-01T21:30:00Z"));
        expect(morning).toBe(evening);
    });

    it("produces different seeds for different calendar days", () => {
        const day1 = dateToSeed(new Date("2026-07-01T12:00:00Z"));
        const day2 = dateToSeed(new Date("2026-07-02T12:00:00Z"));
        expect(day1).not.toBe(day2);
    });

    it("feeds mulberry32 to pick a stable target for a given day", () => {
        const rngA = mulberry32(dateToSeed(new Date("2026-07-01T08:00:00Z")));
        const rngB = mulberry32(dateToSeed(new Date("2026-07-01T20:00:00Z")));
        expect(rngA()).toBe(rngB());
    });
});
