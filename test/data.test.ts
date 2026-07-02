import { resolveClubs } from "../src/dataLoader";
import { GameFile } from "../src/types";

// The single committed dataset. Loaded via require so the test does not depend
// on tsconfig's resolveJsonModule.
const data = require("../src/data/data.json") as GameFile;
const playerIds = Object.keys(data.players);

/**
 * Local mirror of the club-id convention: a club id is the slugified display
 * name (lowercase, diacritics stripped, non-alphanumerics -> single hyphen).
 * Kept in the test — the app never slugifies at runtime — so a hand-authored
 * id that drifts from its name fails loudly.
 */
function slugify(name: string): string {
    return name
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

describe("committed dataset integrity", () => {
    it("has a real pool, not the smoke set (>= 25 players)", () => {
        expect(playerIds.length).toBeGreaterThanOrEqual(25);
    });

    it("references only club ids that exist in the clubs map", () => {
        for (const id of playerIds) {
            for (const clubId of data.players[id].clubs) {
                expect(data.clubs[clubId]).toBeDefined();
            }
        }
    });

    it("keys every club by the slugified form of its display name", () => {
        for (const [clubId, club] of Object.entries(data.clubs)) {
            expect(clubId).toBe(slugify(club.name));
        }
    });
});

describe("saved-game safety: legacy players unchanged", () => {
    // Locks R6 — existing saved games key off these ids and replay against
    // these exact club display-name sequences. Renaming an id or reordering a
    // club here would orphan every stored game for these players.
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
            expect(data.players[id]).toBeDefined();
            expect(resolveClubs(data.players[id].clubs, data.clubs)).toEqual(
                expectedClubs
            );
        }
    );
});
