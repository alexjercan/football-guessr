import "./style.css";
import { mountGame } from "./ui/mountGame";
import { mulberry32 } from "./helpers";

// Practice: a fresh random seed each load, with "Play Again" for endless practice.
mountGame({
    rng: mulberry32(Math.floor(Math.random() * 0x100000000)),
    mode: "practice",
});
