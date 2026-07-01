import { normalizeName, namesMatch } from "../src/matching";

describe("normalizeName", () => {
    it("trims surrounding whitespace", () => {
        expect(normalizeName("  Messi  ")).toBe("messi");
    });

    it("lowercases", () => {
        expect(normalizeName("LIONEL MESSI")).toBe("lionel messi");
    });

    it("collapses internal whitespace runs to a single space", () => {
        expect(normalizeName("Lionel    Messi")).toBe("lionel messi");
        expect(normalizeName("Lionel\t\nMessi")).toBe("lionel messi");
    });

    it("strips diacritics", () => {
        expect(normalizeName("Mbappé")).toBe("mbappe");
        expect(normalizeName("Kylian Mbappé")).toBe("kylian mbappe");
    });
});

describe("namesMatch", () => {
    it("matches identical names", () => {
        expect(namesMatch("Lionel Messi", "Lionel Messi")).toBe(true);
    });

    it("matches ignoring case", () => {
        expect(namesMatch("lionel messi", "Lionel Messi")).toBe(true);
    });

    it("matches ignoring surrounding and internal whitespace", () => {
        expect(namesMatch("  Lionel   Messi ", "Lionel Messi")).toBe(true);
    });

    it("matches ignoring accents", () => {
        expect(namesMatch("Kylian Mbappe", "Kylian Mbappé")).toBe(true);
        expect(namesMatch("Mbappe", "Mbappé")).toBe(true);
    });

    it("does not match different names", () => {
        expect(namesMatch("Cristiano Ronaldo", "Lionel Messi")).toBe(false);
    });

    it("does not match a partial name", () => {
        expect(namesMatch("Messi", "Lionel Messi")).toBe(false);
    });
});
