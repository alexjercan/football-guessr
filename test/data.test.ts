import { buildClubMap, buildPlayers, resolveClubs, SourceData } from "../src/dataGen";
import { ClubMap, RawPlayerEntry } from "../src/types";

// The committed, app-consumed dataset and its editable source. Loaded via
// require so the test does not depend on tsconfig's resolveJsonModule.
const source = require("../src/data/players.source.json") as SourceData;
const players = require("../src/data/players.json") as RawPlayerEntry[];
const clubs = require("../src/data/clubs.json") as ClubMap;

describe("committed dataset integrity", () => {
    it("has a real pool, not the smoke set (>= 25 players)", () => {
        expect(players.length).toBeGreaterThanOrEqual(25);
    });

    it("references only club ids that exist in clubs.json", () => {
        for (const player of players) {
            for (const clubId of player.clubs) {
                expect(clubs[clubId]).toBeDefined();
            }
        }
    });

    it("stays in sync with the source (regenerate would produce no diff)", () => {
        // buildPlayers preserves source order, so a direct deep-equal is valid.
        expect(players).toEqual(buildPlayers(source));

        // clubs.json is emitted in sorted-id order; compare key set + values.
        const rebuilt = buildClubMap(source);
        expect(Object.keys(clubs).sort()).toEqual(Object.keys(rebuilt).sort());
        for (const id of Object.keys(rebuilt)) {
            expect(clubs[id]).toEqual(rebuilt[id]);
        }
    });
});

describe("saved-game safety: legacy players unchanged", () => {
    // Locks R6 — existing saved games key off these ids and replay against
    // these exact club display-name sequences. Re-deriving an id or reordering
    // clubs here would orphan every stored game for these players.
    const LEGACY: Record<string, string[]> = {
        neymar: ["Santos", "Barcelona", "Paris Saint-Germain", "Al-Hilal"],
        messi: ["Barcelona", "Paris Saint-Germain", "Inter Miami"],
        ronaldo: [
            "Sporting CP",
            "Manchester United",
            "Real Madrid",
            "Juventus",
            "Manchester United",
            "Al-Nassr",
        ],
        mbappe: ["AS Monaco", "Paris Saint-Germain", "Real Madrid"],
    };

    it.each(Object.entries(LEGACY))(
        "%s keeps its id and resolved club sequence",
        (id, expectedClubs) => {
            const entry = players.find((p) => p.id === id);
            expect(entry).toBeDefined();
            expect(resolveClubs(entry!.clubs, clubs)).toEqual(expectedClubs);
        }
    );
});
