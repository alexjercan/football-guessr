import {
    MAX_GUESSES,
    createInitialState,
    applyGuess,
    toView,
    createGame,
} from "../src/game";
import { GameState, PlayerEntry } from "../src/types";

/* Inline fixtures (deliberately not the real players.json). */
const threeClubPlayer: PlayerEntry = {
    id: "messi",
    name: "Lionel Messi",
    clubs: ["Barcelona", "Paris Saint-Germain", "Inter Miami"],
};

const singleClubPlayer: PlayerEntry = {
    id: "solo",
    name: "Solo Player",
    clubs: ["OnlyClub"],
};

const accentPlayer: PlayerEntry = {
    id: "mbappe",
    name: "Kylian Mbappé",
    clubs: ["AS Monaco", "Paris Saint-Germain", "Real Madrid"],
};

/** Apply the same guess `times` times, threading the state. */
function applyMany(state: GameState, guess: string, times: number): GameState {
    let next = state;
    for (let i = 0; i < times; i++) {
        next = applyGuess(next, guess);
    }
    return next;
}

describe("createInitialState", () => {
    it("reveals only the first club with no guesses used and status playing", () => {
        const state = createInitialState(threeClubPlayer);
        expect(state.revealedCount).toBe(1);
        expect(state.guesses).toEqual([]);
        expect(state.status).toBe("playing");
        expect(state.maxGuesses).toBe(MAX_GUESSES);
        expect(toView(state).revealedClubs).toEqual(["Barcelona"]);
    });

    it("respects a custom guess limit", () => {
        const state = createInitialState(threeClubPlayer, 5);
        expect(state.maxGuesses).toBe(5);
        expect(toView(state).guessesRemaining).toBe(5);
    });

    it("throws a clear error when no player is supplied", () => {
        expect(() =>
            createInitialState(undefined as unknown as PlayerEntry)
        ).toThrow(/player is required/);
    });
});

describe("applyGuess", () => {
    it("marks a correct guess as won (accent-insensitive)", () => {
        const state = applyGuess(
            createInitialState(accentPlayer),
            "kylian mbappe"
        );
        expect(state.status).toBe("won");
        expect(state.guesses).toEqual(["kylian mbappe"]);
    });

    it("increments the count and reveals the next club on a wrong guess", () => {
        const state = applyGuess(
            createInitialState(threeClubPlayer),
            "Ronaldo"
        );
        expect(state.status).toBe("playing");
        expect(state.guesses).toHaveLength(1);
        expect(toView(state).revealedClubs).toEqual([
            "Barcelona",
            "Paris Saint-Germain",
        ]);
    });

    it("ignores empty and whitespace-only guesses (no count, no reveal)", () => {
        const initial = createInitialState(threeClubPlayer);
        const afterEmpty = applyGuess(initial, "");
        const afterBlank = applyGuess(afterEmpty, "   \t");
        // No-op returns the same reference.
        expect(afterEmpty).toBe(initial);
        expect(afterBlank).toBe(initial);
        expect(afterBlank.guesses).toHaveLength(0);
        expect(afterBlank.revealedCount).toBe(1);
    });

    it("counts duplicate guesses", () => {
        let state = createInitialState(threeClubPlayer);
        state = applyGuess(state, "Pele");
        state = applyGuess(state, "Pele");
        expect(state.guesses).toEqual(["Pele", "Pele"]);
        expect(toView(state).guessesUsed).toBe(2);
    });

    it("cycles through clubs then continues without new hints", () => {
        let state = createInitialState(threeClubPlayer);
        expect(toView(state).revealedClubs).toEqual(["Barcelona"]);

        state = applyGuess(state, "w1");
        expect(toView(state).revealedClubs).toEqual([
            "Barcelona",
            "Paris Saint-Germain",
        ]);

        state = applyGuess(state, "w2");
        expect(toView(state).revealedClubs).toEqual([
            "Barcelona",
            "Paris Saint-Germain",
            "Inter Miami",
        ]);
        expect(toView(state).outOfHints).toBe(true);

        // Clubs exhausted: keep accepting guesses with no new hint.
        state = applyGuess(state, "w3");
        expect(toView(state).revealedClubs).toHaveLength(3);
        expect(state.guesses).toHaveLength(3);
        expect(state.status).toBe("playing");
    });

    it("becomes lost after the maximum number of wrong guesses", () => {
        const state = applyMany(
            createInitialState(threeClubPlayer),
            "nope",
            MAX_GUESSES
        );
        expect(state.status).toBe("lost");
        expect(state.guesses).toHaveLength(MAX_GUESSES);
        const view = toView(state);
        expect(view.guessesRemaining).toBe(0);
        expect(view.answer).toBe("Lionel Messi");
    });

    it("lets a correct guess on the final allowed attempt win over losing", () => {
        let state = applyMany(
            createInitialState(threeClubPlayer),
            "nope",
            MAX_GUESSES - 1
        );
        expect(state.status).toBe("playing");
        state = applyGuess(state, "Lionel Messi");
        expect(state.status).toBe("won");
        expect(state.guesses).toHaveLength(MAX_GUESSES);
    });

    it("is a no-op once the game has ended", () => {
        const won = applyGuess(
            createInitialState(threeClubPlayer),
            "Lionel Messi"
        );
        expect(won.status).toBe("won");
        expect(applyGuess(won, "another")).toBe(won);

        const lost = applyMany(
            createInitialState(threeClubPlayer),
            "nope",
            MAX_GUESSES
        );
        expect(lost.status).toBe("lost");
        expect(applyGuess(lost, "another")).toBe(lost);
    });

    it("does not crash for a single-club player and never over-reveals", () => {
        let state = createInitialState(singleClubPlayer);
        expect(toView(state).revealedClubs).toEqual(["OnlyClub"]);
        expect(toView(state).outOfHints).toBe(true);

        state = applyGuess(state, "wrong");
        expect(toView(state).revealedClubs).toEqual(["OnlyClub"]);
        expect(state.status).toBe("playing");

        state = applyGuess(state, "Solo Player");
        expect(state.status).toBe("won");
    });

    it("never mutates the input state", () => {
        const state = createInitialState(threeClubPlayer);
        const snapshot = JSON.parse(JSON.stringify(state)) as GameState;
        applyGuess(state, "wrong");
        expect(state).toEqual(snapshot);
    });
});

describe("toView", () => {
    it("hides the answer while playing and reveals it once the game is over", () => {
        const playing = createInitialState(threeClubPlayer);
        expect(toView(playing).answer).toBeNull();

        const won = applyGuess(playing, "Lionel Messi");
        expect(toView(won).answer).toBe("Lionel Messi");
    });

    it("never reports a negative guesses-remaining", () => {
        const state = applyMany(
            createInitialState(threeClubPlayer),
            "nope",
            MAX_GUESSES
        );
        expect(toView(state).guessesRemaining).toBe(0);
    });
});

describe("createGame facade", () => {
    it("uses forcePlayer for a deterministic target", () => {
        const game = createGame([threeClubPlayer, accentPlayer], {
            forcePlayer: accentPlayer,
        });
        const view = game.getView();
        expect(view.revealedClubs).toEqual(["AS Monaco"]);
        expect(view.answer).toBeNull();
        expect(view.guessesRemaining).toBe(MAX_GUESSES);
    });

    it("exposes the current target's id via getPlayerId", () => {
        const game = createGame([threeClubPlayer, accentPlayer], {
            forcePlayer: accentPlayer,
        });
        expect(game.getPlayerId()).toBe("mbappe");
    });

    it("selects the target via the injected rng", () => {
        const players = [threeClubPlayer, accentPlayer];
        expect(
            createGame(players, { rng: () => 0 }).getView().revealedClubs
        ).toEqual(["Barcelona"]);
        expect(
            createGame(players, { rng: () => 0.6 }).getView().revealedClubs
        ).toEqual(["AS Monaco"]);
    });

    it("drives a game to a win through submitGuess", () => {
        const game = createGame([threeClubPlayer], {
            forcePlayer: threeClubPlayer,
        });
        const afterWrong = game.submitGuess("wrong");
        expect(afterWrong.status).toBe("playing");
        expect(afterWrong.guessesUsed).toBe(1);
        expect(afterWrong.revealedClubs).toEqual([
            "Barcelona",
            "Paris Saint-Germain",
        ]);

        const afterCorrect = game.submitGuess("Lionel Messi");
        expect(afterCorrect.status).toBe("won");
        expect(afterCorrect.answer).toBe("Lionel Messi");
    });

    it("drives a game to a loss through submitGuess", () => {
        const game = createGame([threeClubPlayer], {
            forcePlayer: threeClubPlayer,
            maxGuesses: 2,
        });
        game.submitGuess("nope");
        const view = game.submitGuess("nope");
        expect(view.status).toBe("lost");
        expect(view.guessesRemaining).toBe(0);
        expect(view.answer).toBe("Lionel Messi");
    });

    it("restart() resets to a fresh game", () => {
        const game = createGame([threeClubPlayer], {
            forcePlayer: threeClubPlayer,
            maxGuesses: 3,
        });
        game.submitGuess("x");
        game.submitGuess("y");
        expect(game.getView().guessesUsed).toBe(2);

        const reset = game.restart();
        expect(reset.guessesUsed).toBe(0);
        expect(reset.status).toBe("playing");
        expect(reset.revealedClubs).toEqual(["Barcelona"]);
    });

    it("throws a clear error for an empty player list", () => {
        expect(() => createGame([])).toThrow(/at least one player/);
    });
});
