import "./style.css";
import { mountGame } from "./ui/mountGame";
import { mulberry32, dateToSeed, dailyPuzzleNumber } from "./helpers";

// Daily: seed from today's UTC date so everyone gets the same player (Wordle-style).
const today = new Date();
const seed = dateToSeed(today);
mountGame({
    rng: mulberry32(seed),
    mode: "daily",
    seed,
    puzzleNumber: dailyPuzzleNumber(today),
});
