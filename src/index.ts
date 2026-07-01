import "./style.css";
import { mountGame } from "./ui/mountGame";
import { mulberry32, dateToSeed } from "./helpers";

// Daily: seed from today's UTC date so everyone gets the same player (Wordle-style).
mountGame({ rng: mulberry32(dateToSeed(new Date())), mode: "daily" });
