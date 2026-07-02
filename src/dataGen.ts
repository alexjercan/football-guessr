import type { ClubMap, RawPlayerEntry } from "./types";

/**
 * Pure, DOM-free data-generation transform. Turns the human-editable source
 * list (`src/data/players.source.json`, clubs written as plain display names)
 * into the two committed, app-consumed files: the id-based `players.json` and
 * the deduplicated `clubs.json` map. The same {@link resolveClubs} helper is
 * reused by the loader to collapse club ids back into display names, so the
 * game reducer keeps seeing `clubs: string[]` exactly as before.
 *
 * Type-only imports here (`import type`) are erased at runtime, so this module
 * has no runtime dependencies and can be imported by a plain Node/tsx runner
 * without any module-resolution setup.
 */

/** One player in the editable source: clubs are display-name strings. */
export interface SourcePlayer {
    id: string;
    name: string;
    /** Ordered career, as display names (e.g. "Paris Saint-Germain"). */
    clubs: string[];
    photo?: string;
    description?: string;
}

/**
 * The editable source document. Optional `clubs` supplies extra metadata
 * (country/crest) keyed by club *display name*; any club not listed there is
 * emitted with just its name.
 */
export interface SourceData {
    players: SourcePlayer[];
    clubs?: Record<string, { country?: string; crest?: string }>;
}

/**
 * Derive a stable club id from a display name: lowercase, strip diacritics,
 * collapse every run of non-alphanumerics to a single hyphen, trim hyphens.
 * "Paris Saint-Germain" -> "paris-saint-germain", "Beşiktaş" -> "besiktas".
 */
export function slugifyClub(name: string): string {
    return name
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "") // strip combining accent marks (as matching.ts)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Build the deduplicated club map from the source. Every distinct club display
 * name across all players becomes one entry keyed by its slug id, carrying any
 * country/crest metadata the source provided. Throws if two different display
 * names collapse onto the same id (an ambiguous dataset we should never ship).
 */
export function buildClubMap(source: SourceData): ClubMap {
    const meta = source.clubs ?? {};
    const map: ClubMap = {};

    for (const player of source.players) {
        for (const displayName of player.clubs) {
            const id = slugifyClub(displayName);

            const existing = map[id];
            if (existing && existing.name !== displayName) {
                throw new Error(
                    `Club id collision: "${existing.name}" and "${displayName}" both slugify to "${id}". Give one of them a distinct name.`
                );
            }
            if (existing) {
                continue;
            }

            map[id] = { name: displayName, ...meta[displayName] };
        }
    }

    return map;
}

/**
 * Build the id-based player list: club display names become club ids, player
 * id and club order are preserved verbatim (player ids are storage keys — see
 * KTD4 — so they are never re-derived). Optional media fields pass through;
 * the guarded spreads keep unset fields absent rather than `key: undefined`.
 */
export function buildPlayers(source: SourceData): RawPlayerEntry[] {
    return source.players.map(({ id, name, clubs, photo, description }) => ({
        id,
        name,
        clubs: clubs.map(slugifyClub),
        ...(photo !== undefined && { photo }),
        ...(description !== undefined && { description }),
    }));
}

/**
 * Resolve an ordered list of club ids back to display names using the club
 * map. A missing id falls back to the id string itself so a data typo degrades
 * to a visible-but-harmless label rather than blanking a hint or throwing.
 */
export function resolveClubs(clubIds: string[], clubMap: ClubMap): string[] {
    return clubIds.map((id) => clubMap[id]?.name ?? id);
}
