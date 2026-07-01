import "./style.css";
import { mountGame } from "./ui/mountGame";
import { mulberry32 } from "./helpers";

// Practice: seed from the current timestamp — a fresh random player each load,
// and that same timestamp keys the saved game (each finished play is its own
// record), mirroring how Daily uses its per-day seed. "Play Again" re-rolls it.
const seed = Date.now();
mountGame({
    rng: mulberry32(seed),
    mode: "practice",
    seed,
});
