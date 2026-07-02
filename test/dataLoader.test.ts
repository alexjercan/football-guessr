// Under webpack the JSON `require`s resolve to asset URLs; in jest we mock them
// to sentinel URLs (virtual, so the test doesn't depend on the real data files)
// and stub `fetch` to serve fixture payloads for each URL.
jest.mock("../src/data/players.json", () => "players-url", { virtual: true });
jest.mock("../src/data/clubs.json", () => "clubs-url", { virtual: true });

import { loadGameData } from "../src/dataLoader";
import { ClubMap, RawPlayerEntry } from "../src/types";

const CLUB_MAP: ClubMap = {
    santos: { name: "Santos" },
    barcelona: { name: "Barcelona", country: "ES" },
    "paris-saint-germain": { name: "Paris Saint-Germain" },
    "manchester-united": { name: "Manchester United" },
    "real-madrid": { name: "Real Madrid" },
};

function stubFetch(players: RawPlayerEntry[], clubs: ClubMap): void {
    global.fetch = jest.fn((url: string) => {
        const body = url === "players-url" ? players : url === "clubs-url" ? clubs : null;
        if (body === null) {
            return Promise.reject(new Error(`unexpected url: ${url}`));
        }
        return Promise.resolve({ json: () => Promise.resolve(body) } as Response);
    }) as unknown as typeof fetch;
}

describe("loadGameData", () => {
    it("resolves club ids to ordered display names", async () => {
        stubFetch(
            [{ id: "neymar", name: "Neymar Jr", clubs: ["santos", "barcelona", "paris-saint-germain"] }],
            CLUB_MAP
        );
        const { players } = await loadGameData();
        expect(players).toHaveLength(1);
        expect(players[0].clubs).toEqual(["Santos", "Barcelona", "Paris Saint-Germain"]);
    });

    it("preserves repeated clubs in order", async () => {
        stubFetch(
            [
                {
                    id: "ronaldo",
                    name: "Cristiano Ronaldo",
                    clubs: ["manchester-united", "real-madrid", "manchester-united"],
                },
            ],
            CLUB_MAP
        );
        const { players } = await loadGameData();
        expect(players[0].clubs).toEqual([
            "Manchester United",
            "Real Madrid",
            "Manchester United",
        ]);
    });

    it("falls back to the id string for an unknown club, without throwing", async () => {
        stubFetch([{ id: "x", name: "X", clubs: ["barcelona", "mystery-fc"] }], CLUB_MAP);
        const { players } = await loadGameData();
        expect(players[0].clubs).toEqual(["Barcelona", "mystery-fc"]);
    });

    it("passes optional photo/description through, leaving them undefined when unset", async () => {
        stubFetch(
            [
                {
                    id: "a",
                    name: "A",
                    clubs: ["barcelona"],
                    photo: "assets/players/a.webp",
                    description: "blurb",
                },
                { id: "b", name: "B", clubs: ["santos"] },
            ],
            CLUB_MAP
        );
        const { players } = await loadGameData();
        expect(players[0].photo).toBe("assets/players/a.webp");
        expect(players[0].description).toBe("blurb");
        expect(players[1].photo).toBeUndefined();
        expect(players[1].description).toBeUndefined();
    });

    it("produces a plain string[] the reducer can slice", async () => {
        stubFetch([{ id: "a", name: "A", clubs: ["santos", "barcelona"] }], CLUB_MAP);
        const { players } = await loadGameData();
        expect(Array.isArray(players[0].clubs)).toBe(true);
        expect(players[0].clubs.slice(0, 1)).toEqual(["Santos"]);
    });
});
