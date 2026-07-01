/**
 * A minimal key/value storage abstraction. Mirrors the tiny slice of the
 * `localStorage` API the game actually needs, so it can be swapped for an
 * in-memory fake in tests and is safe to construct where `localStorage`
 * doesn't exist (SSR, older/locked-down browsers, private-mode quirks).
 */
export interface StorageProvider {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    /**
     * Every key currently held, in no guaranteed order. Used to enumerate the
     * individual per-game records (each game is its own key) so the full list
     * can be rebuilt at runtime rather than kept as a single array blob.
     */
    keys(): string[];
}

/**
 * Wraps `window.localStorage`, degrading to a harmless no-op when it's
 * unavailable or throws (e.g. Safari private mode throws on `setItem`). Reads
 * return `null` and writes are silently dropped rather than crashing the game.
 */
export class BrowserStorage implements StorageProvider {
    private readonly backing: Storage | null;

    constructor(backing?: Storage | null) {
        if (backing !== undefined) {
            this.backing = backing;
        } else if (typeof localStorage === "undefined") {
            this.backing = null;
        } else {
            this.backing = localStorage;
        }
    }

    getItem(key: string): string | null {
        if (!this.backing) {
            return null;
        }
        try {
            return this.backing.getItem(key);
        } catch {
            return null;
        }
    }

    setItem(key: string, value: string): void {
        if (!this.backing) {
            return;
        }
        try {
            this.backing.setItem(key, value);
        } catch {
            /* Quota exceeded or storage disabled: drop the write. */
        }
    }

    removeItem(key: string): void {
        if (!this.backing) {
            return;
        }
        try {
            this.backing.removeItem(key);
        } catch {
            /* Ignore. */
        }
    }

    keys(): string[] {
        if (!this.backing) {
            return [];
        }
        try {
            const out: string[] = [];
            for (let i = 0; i < this.backing.length; i++) {
                const key = this.backing.key(i);
                if (key !== null) {
                    out.push(key);
                }
            }
            return out;
        } catch {
            return [];
        }
    }
}

/** An in-memory {@link StorageProvider}, handy for tests and SSR fallbacks. */
export class MemoryStorage implements StorageProvider {
    private readonly map = new Map<string, string>();

    getItem(key: string): string | null {
        return this.map.has(key) ? (this.map.get(key) as string) : null;
    }

    setItem(key: string, value: string): void {
        this.map.set(key, value);
    }

    removeItem(key: string): void {
        this.map.delete(key);
    }

    keys(): string[] {
        return [...this.map.keys()];
    }
}

let defaultInstance: StorageProvider | null = null;

/** Process-wide default provider (browser-backed), created lazily. */
export function defaultStorage(): StorageProvider {
    if (!defaultInstance) {
        defaultInstance = new BrowserStorage();
    }
    return defaultInstance;
}
