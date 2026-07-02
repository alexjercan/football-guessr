import { resolveClubs } from "./dataGen";
import { ClubMap, GameData, PlayerEntry, RawPlayerEntry } from "./types";

/**
 * Load the dataset and resolve it into game-ready {@link PlayerEntry} objects.
 *
 * The committed data is split in two: `players.json` references clubs by *id*,
 * and `clubs.json` maps each id to a club entity. This loader is the single
 * seam where those collapse back into the ordered display-name `string[]` the
 * reducer, matching, and stats layers already consume — so promoting clubs to
 * entities did not ripple into the game logic. Both files are loaded via the
 * same webpack `asset/resource` + `fetch` path.
 */
export async function loadGameData(): Promise<GameData> {
    const playersUrl = require("./data/players.json") as string;
    const clubsUrl = require("./data/clubs.json") as string;

    const [rawPlayers, clubMap] = await Promise.all([
        fetch(playersUrl).then((r) => r.json() as Promise<RawPlayerEntry[]>),
        fetch(clubsUrl).then((r) => r.json() as Promise<ClubMap>),
    ]);

    const players: PlayerEntry[] = rawPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        clubs: resolveClubs(p.clubs, clubMap),
        photo: p.photo,
        description: p.description,
    }));

    return { players };
}
