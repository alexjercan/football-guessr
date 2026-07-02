import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildClubMap, buildPlayers, SourceData } from "../src/dataGen";
import type { ClubMap } from "../src/types";

/**
 * Regenerate the committed dataset from the editable source list.
 *
 *   src/data/players.source.json  (clubs as display names, editable by hand)
 *        -> src/data/players.json (clubs as ids)
 *        -> src/data/clubs.json   (id -> club entity, deduplicated)
 *
 * Thin I/O wrapper only: all transform logic lives in the pure, unit-tested
 * `src/dataGen.ts`. Deterministic and offline — run `npm run gen:data` after
 * editing the source. Club ids are emitted in sorted order so the output is
 * stable across runs regardless of the order clubs first appear in the source.
 */

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../src/data");
const SOURCE = resolve(dataDir, "players.source.json");
const PLAYERS_OUT = resolve(dataDir, "players.json");
const CLUBS_OUT = resolve(dataDir, "clubs.json");

/** Serialize with 4-space indent + trailing newline (repo JSON convention). */
function writeJson(path: string, value: unknown): void {
    writeFileSync(path, JSON.stringify(value, null, 4) + "\n");
}

/** Re-key a club map into sorted-id order for stable, diff-friendly output. */
function sortClubMap(map: ClubMap): ClubMap {
    const sorted: ClubMap = {};
    for (const id of Object.keys(map).sort()) {
        sorted[id] = map[id];
    }
    return sorted;
}

const source = JSON.parse(readFileSync(SOURCE, "utf8")) as SourceData;

// Fail loudly on club-metadata keys that no player references: buildClubMap
// only emits entries for clubs that appear in a player's career, so a mistyped
// or stale `clubs` key (e.g. renaming "Atletico Madrid" -> "Atlético Madrid"
// without updating the metadata) would otherwise be silently dropped.
const referenced = new Set(source.players.flatMap((p) => p.clubs));
const orphaned = Object.keys(source.clubs ?? {}).filter(
    (name) => !referenced.has(name)
);
if (orphaned.length > 0) {
    throw new Error(
        `players.source.json: clubs metadata has ${orphaned.length} key(s) no player references (would be silently dropped): ${orphaned.join(", ")}. Fix the display name or remove the entry.`
    );
}

const clubMap = sortClubMap(buildClubMap(source));
const players = buildPlayers(source);

writeJson(PLAYERS_OUT, players);
writeJson(CLUBS_OUT, clubMap);

console.log(
    `Generated ${players.length} players and ${Object.keys(clubMap).length} clubs.`
);
