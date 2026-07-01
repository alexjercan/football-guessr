import "./style.css";
import { loadGameData } from "./dataLoader";
import { computeGameStats, GameStats } from "./gameStats";
import { GameMode } from "./gameStorage";
import { defaultStorage } from "./storage";

/**
 * Profile / stats page. Reads the saved games via {@link computeGameStats}
 * (which *derives* every figure by replaying each game — see gameStats.ts) and
 * paints two tabs of stats, one per mode. This module owns only the DOM; all
 * the aggregation logic lives in the pure, tested `gameStats` module.
 *
 * Adapted from the reference profile page, trimmed to what V2 needs: the
 * rolling-average SVG graph and the collection carousel are intentionally left
 * out (see TASK.md "out of scope").
 */
async function main(): Promise<void> {
    const gameData = await loadGameData();
    const storage = defaultStorage();

    const statsDaily = computeGameStats(gameData, "daily", storage);
    const statsPractice = computeGameStats(gameData, "practice", storage);

    updateStatsUI("daily", statsDaily);
    updateStatsUI("practice", statsPractice);
    setupTabs();
}

/** Wire the Daily/Practice tab buttons to toggle their panels. */
function setupTabs(): void {
    const dailyTab = document.getElementById("daily-tab");
    const practiceTab = document.getElementById("practice-tab");
    const dailyStats = document.getElementById("daily-stats");
    const practiceStats = document.getElementById("practice-stats");

    if (!dailyTab || !practiceTab || !dailyStats || !practiceStats) {
        return;
    }

    const select = (
        activeTab: HTMLElement,
        activePanel: HTMLElement,
        inactiveTab: HTMLElement,
        inactivePanel: HTMLElement
    ): void => {
        activeTab.classList.add("active");
        activeTab.setAttribute("aria-selected", "true");
        inactiveTab.classList.remove("active");
        inactiveTab.setAttribute("aria-selected", "false");
        activePanel.hidden = false;
        inactivePanel.hidden = true;
    };

    dailyTab.addEventListener("click", () =>
        select(dailyTab, dailyStats, practiceTab, practiceStats)
    );
    practiceTab.addEventListener("click", () =>
        select(practiceTab, practiceStats, dailyTab, dailyStats)
    );
}

/** Set an element's text by id; silently ignores a missing element. */
function setText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
    }
}

/**
 * Paint one mode's panel from its {@link GameStats}. Element ids follow the
 * `<field>-<mode>` convention in profile.html, so a single suffix drives every
 * lookup.
 */
function updateStatsUI(mode: GameMode, stats: GameStats): void {
    setText(`games-played-${mode}`, stats.gamesPlayed.toString());

    const winRate =
        stats.gamesPlayed > 0
            ? Math.round((stats.wins / stats.gamesPlayed) * 100)
            : 0;
    setText(`win-rate-${mode}`, `${winRate}%`);

    setText(`current-streak-${mode}`, stats.currentStreak.toString());
    setText(`longest-streak-${mode}`, stats.longestStreak.toString());

    setText(
        `avg-guesses-${mode}`,
        stats.wins > 0 ? stats.averageGuesses.toFixed(1) : "0"
    );
    setText(`total-wins-${mode}`, stats.wins.toString());
    setText(`total-losses-${mode}`, stats.losses.toString());

    renderGuessDistribution(
        stats.guessDistribution,
        stats.wins,
        `guess-distribution-${mode}`
    );
}

/**
 * Render the "won in N guesses" bar chart into the container. Each row's bar is
 * scaled to the most common bucket so the tallest bar always fills the track.
 * Built from DOM nodes (not innerHTML) to stay consistent with the rest of the
 * codebase.
 */
function renderGuessDistribution(
    distribution: Map<number, number>,
    totalWins: number,
    containerId: string
): void {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    container.textContent = "";

    if (totalWins === 0) {
        const empty = document.createElement("p");
        empty.className = "profile-no-data";
        empty.textContent =
            "No wins yet! Play some games to see your distribution.";
        container.appendChild(empty);
        return;
    }

    const counts = [...distribution.values()];
    const maxCount = counts.length > 0 ? Math.max(...counts) : 0;
    const maxGuesses =
        distribution.size > 0 ? Math.max(...distribution.keys()) : 0;

    for (let guesses = 1; guesses <= maxGuesses; guesses++) {
        const count = distribution.get(guesses) ?? 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

        const row = document.createElement("div");
        row.className = "profile-dist-row";

        const label = document.createElement("div");
        label.className = "profile-dist-label";
        label.textContent = guesses.toString();

        const barContainer = document.createElement("div");
        barContainer.className = "profile-dist-bar-container";

        const bar = document.createElement("div");
        bar.className = "profile-dist-bar";
        // A sliver of width even for zero so the count stays readable.
        bar.style.width = `${Math.max(percentage, count > 0 ? 8 : 0)}%`;
        if (count > 0) {
            bar.classList.add("has-value");
        }

        const countEl = document.createElement("div");
        countEl.className = "profile-dist-count";
        countEl.textContent = count.toString();

        bar.appendChild(countEl);
        barContainer.appendChild(bar);
        row.appendChild(label);
        row.appendChild(barContainer);
        container.appendChild(row);
    }
}

main();
