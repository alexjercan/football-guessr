import { PlayerEntry } from "./types";

export function chooseRandomPlayer(
    seed: number,
    players: PlayerEntry[]
): PlayerEntry {
    const randomIndex = Math.floor(seed * players.length);
    return players[randomIndex];
}
