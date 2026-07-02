import {
    slugifyClub,
    buildClubMap,
    buildPlayers,
    resolveClubs,
    SourceData,
} from "../src/dataGen";

describe("slugifyClub", () => {
    it("slugifies simple names", () => {
        expect(slugifyClub("Barcelona")).toBe("barcelona");
        expect(slugifyClub("Manchester United")).toBe("manchester-united");
    });

    it("handles diacritics and punctuation", () => {
        expect(slugifyClub("Paris Saint-Germain")).toBe("paris-saint-germain");
        expect(slugifyClub("Beşiktaş")).toBe("besiktas");
        expect(slugifyClub("1. FC Köln")).toBe("1-fc-koln");
        expect(slugifyClub("Atlético Madrid")).toBe("atletico-madrid");
    });

    it("trims stray hyphens from edges", () => {
        expect(slugifyClub("  Al-Nassr  ")).toBe("al-nassr");
        expect(slugifyClub("(Free agent)")).toBe("free-agent");
    });
});

describe("buildClubMap", () => {
    it("deduplicates clubs shared across players", () => {
        const source: SourceData = {
            players: [
                { id: "a", name: "A", clubs: ["Barcelona", "PSG"] },
                { id: "b", name: "B", clubs: ["Barcelona"] },
            ],
        };
        const map = buildClubMap(source);
        expect(Object.keys(map).sort()).toEqual(["barcelona", "psg"]);
        expect(map.barcelona).toEqual({ name: "Barcelona" });
    });

    it("carries country/crest metadata when provided, omits it otherwise", () => {
        const source: SourceData = {
            players: [{ id: "a", name: "A", clubs: ["Barcelona", "PSG"] }],
            clubs: { Barcelona: { country: "ES" } },
        };
        const map = buildClubMap(source);
        expect(map.barcelona).toEqual({ name: "Barcelona", country: "ES" });
        expect(map.psg).toEqual({ name: "PSG" });
        expect(map.psg.country).toBeUndefined();
    });

    it("throws when two distinct names collide onto one id", () => {
        const source: SourceData = {
            players: [
                { id: "a", name: "A", clubs: ["FC Köln"] },
                { id: "b", name: "B", clubs: ["FC Koln"] },
            ],
        };
        expect(() => buildClubMap(source)).toThrow(/collision/i);
    });
});

describe("buildPlayers", () => {
    it("maps club display names to ids, preserving order and repeats", () => {
        const source: SourceData = {
            players: [
                {
                    id: "ronaldo",
                    name: "Cristiano Ronaldo",
                    clubs: [
                        "Sporting CP",
                        "Manchester United",
                        "Real Madrid",
                        "Juventus",
                        "Manchester United",
                        "Al-Nassr",
                    ],
                },
            ],
        };
        const [ronaldo] = buildPlayers(source);
        expect(ronaldo.clubs).toEqual([
            "sporting-cp",
            "manchester-united",
            "real-madrid",
            "juventus",
            "manchester-united",
            "al-nassr",
        ]);
    });

    it("preserves the source player id verbatim (never slugifies the name)", () => {
        const source: SourceData = {
            players: [{ id: "messi", name: "Lionel Messi", clubs: ["Barcelona"] }],
        };
        expect(buildPlayers(source)[0].id).toBe("messi");
    });

    it("passes optional photo/description through, omitting when unset", () => {
        const source: SourceData = {
            players: [
                {
                    id: "a",
                    name: "A",
                    clubs: ["Barcelona"],
                    photo: "assets/players/a.webp",
                    description: "desc",
                },
                { id: "b", name: "B", clubs: ["PSG"] },
            ],
        };
        const [a, b] = buildPlayers(source);
        expect(a.photo).toBe("assets/players/a.webp");
        expect(a.description).toBe("desc");
        expect(b.photo).toBeUndefined();
        expect(b.description).toBeUndefined();
    });
});

describe("resolveClubs", () => {
    it("round-trips build output back to the original display names", () => {
        const source: SourceData = {
            players: [
                {
                    id: "neymar",
                    name: "Neymar Jr",
                    clubs: [
                        "Santos",
                        "Barcelona",
                        "Paris Saint-Germain",
                        "Al-Hilal",
                    ],
                },
            ],
        };
        const map = buildClubMap(source);
        const [neymar] = buildPlayers(source);
        expect(resolveClubs(neymar.clubs, map)).toEqual([
            "Santos",
            "Barcelona",
            "Paris Saint-Germain",
            "Al-Hilal",
        ]);
    });

    it("falls back to the id string for an unknown club id", () => {
        expect(resolveClubs(["barcelona", "mystery-fc"], { barcelona: { name: "Barcelona" } })).toEqual([
            "Barcelona",
            "mystery-fc",
        ]);
    });
});
