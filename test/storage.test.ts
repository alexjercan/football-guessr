import {
    BrowserStorage,
    MemoryStorage,
    StorageProvider,
    defaultStorage,
} from "../src/storage";

describe("MemoryStorage", () => {
    it("round-trips values and reports absent keys as null", () => {
        const s = new MemoryStorage();
        expect(s.getItem("missing")).toBeNull();
        s.setItem("a", "1");
        expect(s.getItem("a")).toBe("1");
    });

    it("overwrites and removes keys", () => {
        const s = new MemoryStorage();
        s.setItem("a", "1");
        s.setItem("a", "2");
        expect(s.getItem("a")).toBe("2");
        s.removeItem("a");
        expect(s.getItem("a")).toBeNull();
    });

    it("treats a stored empty string as present (not null)", () => {
        const s = new MemoryStorage();
        s.setItem("a", "");
        expect(s.getItem("a")).toBe("");
    });

    it("enumerates its keys and reflects removals", () => {
        const s = new MemoryStorage();
        expect(s.keys()).toEqual([]);
        s.setItem("a", "1");
        s.setItem("b", "2");
        expect(s.keys().sort()).toEqual(["a", "b"]);
        s.removeItem("a");
        expect(s.keys()).toEqual(["b"]);
    });
});

describe("BrowserStorage", () => {
    it("delegates to an injected Storage-like backing", () => {
        const backing = new MemoryStorage();
        const s = new BrowserStorage(backing as unknown as Storage);
        s.setItem("k", "v");
        expect(backing.getItem("k")).toBe("v");
        expect(s.getItem("k")).toBe("v");
        s.removeItem("k");
        expect(s.getItem("k")).toBeNull();
    });

    it("enumerates keys from a native-like backing via length/key(i)", () => {
        // A minimal Storage stub that walks an ordered list, like the real one.
        const entries = new Map<string, string>();
        const backing: Storage = {
            get length(): number {
                return entries.size;
            },
            clear(): void {
                entries.clear();
            },
            key(i: number): string | null {
                return [...entries.keys()][i] ?? null;
            },
            getItem(k: string): string | null {
                return entries.has(k) ? (entries.get(k) as string) : null;
            },
            setItem(k: string, v: string): void {
                entries.set(k, v);
            },
            removeItem(k: string): void {
                entries.delete(k);
            },
        };
        const s = new BrowserStorage(backing);
        s.setItem("x", "1");
        s.setItem("y", "2");
        expect(s.keys().sort()).toEqual(["x", "y"]);
    });

    it("degrades to a no-op when constructed with a null backing", () => {
        const s = new BrowserStorage(null);
        expect(s.getItem("k")).toBeNull();
        // Neither of these should throw.
        s.setItem("k", "v");
        s.removeItem("k");
        expect(s.getItem("k")).toBeNull();
        expect(s.keys()).toEqual([]);
    });

    it("swallows exceptions from a throwing backing (e.g. private mode)", () => {
        const throwing: Storage = {
            get length(): number {
                return 0;
            },
            clear(): void {
                throw new Error("nope");
            },
            key(): string | null {
                throw new Error("nope");
            },
            getItem(): string | null {
                throw new Error("read blocked");
            },
            setItem(): void {
                throw new Error("quota exceeded");
            },
            removeItem(): void {
                throw new Error("blocked");
            },
        };
        const s = new BrowserStorage(throwing);
        expect(() => s.setItem("k", "v")).not.toThrow();
        expect(() => s.removeItem("k")).not.toThrow();
        expect(s.getItem("k")).toBeNull();
        expect(s.keys()).toEqual([]);
    });
});

describe("defaultStorage", () => {
    it("returns a stable StorageProvider instance", () => {
        const a: StorageProvider = defaultStorage();
        const b: StorageProvider = defaultStorage();
        expect(a).toBe(b);
    });
});
