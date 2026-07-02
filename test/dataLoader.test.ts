// Under webpack the JSON `require` resolves to an asset URL; in jest we mock it
// to a sentinel URL (virtual, so the test doesn't depend on the real data file)
// and stub `fetch` to serve a fixture GameFile.
jest.mock("../src/data/data.json", () => "data-url", { virtual: true });

import { loadGameData, resolveClubs } from "../src/dataLoader";
import { ClubMap, GameFile } from "../src/types";

const CLUBS: ClubMap = {
    santos: { name: "Santos" },
    barcelona: { name: "Barcelona", country: "ES" },
    "paris-saint-germain": { name: "Paris Saint-Germain" },
    "manchester-united": { name: "Manchester United" },
    "real-madrid": { name: "Real Madrid" },
};

function stubFetch(file: GameFile): void {
    global.fetch = jest.fn((url: string) => {
        if (url !== "data-url") {
            return Promise.reject(new Error(`unexpected url: ${url}`));
        }
        return Promise.resolve({ json: () => Promise.resolve(file) } as Response);
    }) as unknown as typeof fetch;
}

describe("resolveClubs", () => {
    it("maps ids to display names in order", () => {
        expect(resolveClubs(["santos", "barcelona"], CLUBS)).toEqual([
            "Santos",
            "Barcelona",
        ]);
    });

    it("falls back to the id string for an unknown club", () => {
        expect(resolveClubs(["barcelona", "mystery-fc"], CLUBS)).toEqual([
            "Barcelona",
            "mystery-fc",
        ]);
    });
});

describe("loadGameData", () => {
    it("promotes the player-map key to id and resolves club ids to names", async () => {
        stubFetch({
            players: {
                neymar: {
                    name: "Neymar Jr",
                    clubs: ["santos", "barcelona", "paris-saint-germain"],
                },
            },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(players).toHaveLength(1);
        expect(players[0].id).toBe("neymar");
        expect(players[0].name).toBe("Neymar Jr");
        expect(players[0].clubs).toEqual([
            "Santos",
            "Barcelona",
            "Paris Saint-Germain",
        ]);
    });

    it("preserves repeated clubs in order", async () => {
        stubFetch({
            players: {
                ronaldo: {
                    name: "Cristiano Ronaldo",
                    clubs: ["manchester-united", "real-madrid", "manchester-united"],
                },
            },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(players[0].clubs).toEqual([
            "Manchester United",
            "Real Madrid",
            "Manchester United",
        ]);
    });

    it("preserves player insertion order", async () => {
        stubFetch({
            players: {
                neymar: { name: "Neymar Jr", clubs: ["santos"] },
                messi: { name: "Lionel Messi", clubs: ["barcelona"] },
            },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(players.map((p) => p.id)).toEqual(["neymar", "messi"]);
    });

    it("falls back to the id string for an unknown club, without throwing", async () => {
        stubFetch({
            players: { x: { name: "X", clubs: ["barcelona", "mystery-fc"] } },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(players[0].clubs).toEqual(["Barcelona", "mystery-fc"]);
    });

    it("passes optional photo/description through, leaving them undefined when unset", async () => {
        stubFetch({
            players: {
                a: {
                    name: "A",
                    clubs: ["barcelona"],
                    photo: "assets/players/a.webp",
                    description: "blurb",
                },
                b: { name: "B", clubs: ["santos"] },
            },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(players[0].photo).toBe("assets/players/a.webp");
        expect(players[0].description).toBe("blurb");
        expect(players[1].photo).toBeUndefined();
        expect(players[1].description).toBeUndefined();
    });

    it("produces a plain string[] the reducer can slice", async () => {
        stubFetch({
            players: { a: { name: "A", clubs: ["santos", "barcelona"] } },
            clubs: CLUBS,
        });
        const { players } = await loadGameData();
        expect(Array.isArray(players[0].clubs)).toBe(true);
        expect(players[0].clubs.slice(0, 1)).toEqual(["Santos"]);
    });
});
