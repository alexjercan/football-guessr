import { GameData, PlayerEntry } from "./types";

interface RawPlayerEntry {
    id: string;
    name: string;
    clubs: string[];
}

export async function loadGameData(): Promise<GameData> {
    const url = require("./data/players.json") as string;
    const response = await fetch(url);
    const rawPlayers = (await response.json()) as RawPlayerEntry[];

    const players: PlayerEntry[] = rawPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        clubs: p.clubs,
    }));

    return { players };
}
