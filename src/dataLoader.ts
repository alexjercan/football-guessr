import { ClubMap, GameData, GameFile, PlayerEntry } from "./types";

/**
 * Resolve an ordered list of club ids to display names using the club map. A
 * missing id falls back to the id string itself so a data typo degrades to a
 * visible-but-harmless label rather than blanking a hint or throwing.
 */
export function resolveClubs(clubIds: string[], clubs: ClubMap): string[] {
    return clubIds.map((id) => clubs[id]?.name ?? id);
}

/**
 * Load the dataset and resolve it into game-ready {@link PlayerEntry} objects.
 *
 * The committed `data.json` keys players and clubs by stable slug ids and has a
 * player reference clubs by id. This loader is the single seam that looks each
 * id up in the `clubs` map, collapsing the career into the ordered display-name
 * `string[]` the reducer, matching, and stats layers already consume — so
 * keying clubs by id never rippled into the game logic. The player id is the
 * map key, promoted onto each entry here.
 */
export async function loadGameData(): Promise<GameData> {
    const url = require("./data/data.json") as string;
    const data = (await fetch(url).then((r) => r.json())) as GameFile;

    const players: PlayerEntry[] = Object.entries(data.players).map(
        ([id, p]) => ({
            id,
            name: p.name,
            clubs: resolveClubs(p.clubs, data.clubs),
            photo: p.photo,
            description: p.description,
        })
    );

    return { players };
}
