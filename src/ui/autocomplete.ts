import { findMatches } from "../matching";

/** Cap the dropdown height so a broad query can't paper over the whole board. */
const MAX_SUGGESTIONS = 8;

export interface SetupAutocompleteOptions {
    /** The guess text input the dropdown attaches to. */
    inputEl: HTMLInputElement;
    /** The (absolutely-positioned) container the suggestions render into. */
    autocompleteBox: HTMLElement;
    /** Every real player name; the only values a guess may resolve to. */
    playerNames: string[];
    /**
     * Predicate for "already guessed": such names are dropped from the
     * suggestions so a player can't waste a guess re-submitting them.
     */
    isGuessed: (name: string) => boolean;
    /**
     * Invoked with a real, chosen player name (click or Enter on a highlighted
     * row). The caller populates the input and submits.
     */
    onSelect: (name: string) => void;
}

export interface AutocompleteController {
    /** Recompute the dropdown from the current input value (call after render). */
    refresh(): void;
    /** Hide the dropdown and clear its contents. */
    close(): void;
    /**
     * The names currently offered, best-first. Empty when nothing matches —
     * which is exactly the signal the caller uses to reject invalid input.
     */
    getSuggestions(): string[];
}

/**
 * Wire a type-ahead dropdown onto a text input. All fuzzy matching lives in the
 * pure {@link findMatches} (unit-tested without the DOM); this module only owns
 * the DOM: rendering rows, focus/blur visibility, and keyboard navigation.
 */
export function setupAutocomplete({
    inputEl,
    autocompleteBox,
    playerNames,
    isGuessed,
    onSelect,
}: SetupAutocompleteOptions): AutocompleteController {
    let suggestions: string[] = [];
    let activeIndex = -1;

    const computeSuggestions = (): string[] => {
        const excluded = playerNames.filter((name) => isGuessed(name));
        return findMatches(playerNames, inputEl.value, excluded)
            .slice(0, MAX_SUGGESTIONS)
            .map((match) => match.name);
    };

    const close = (): void => {
        suggestions = [];
        activeIndex = -1;
        autocompleteBox.textContent = "";
        autocompleteBox.hidden = true;
    };

    const paintActive = (): void => {
        const rows = autocompleteBox.children;
        for (let i = 0; i < rows.length; i++) {
            rows[i].classList.toggle("is-active", i === activeIndex);
        }
    };

    const choose = (name: string): void => {
        close();
        onSelect(name);
    };

    const render = (): void => {
        autocompleteBox.textContent = "";

        if (suggestions.length === 0) {
            autocompleteBox.hidden = true;
            return;
        }

        suggestions.forEach((name, index) => {
            const row = document.createElement("div");
            row.className = "autocomplete__item";
            row.setAttribute("role", "option");
            row.textContent = name;
            // mousedown (not click) fires before the input's blur, so the
            // selection isn't swallowed by the dropdown closing on blur.
            row.addEventListener("mousedown", (event) => {
                event.preventDefault();
                choose(name);
            });
            row.addEventListener("mousemove", () => {
                activeIndex = index;
                paintActive();
            });
            autocompleteBox.appendChild(row);
        });

        autocompleteBox.hidden = false;
        paintActive();
    };

    const refresh = (): void => {
        suggestions = computeSuggestions();
        // Keep a valid highlight: default to the top (best) match.
        activeIndex = suggestions.length > 0 ? 0 : -1;
        render();
    };

    inputEl.addEventListener("input", refresh);

    inputEl.addEventListener("focus", refresh);

    inputEl.addEventListener("blur", () => {
        // Delay so a mousedown on a row still lands before we tear down.
        window.setTimeout(close, 0);
    });

    inputEl.addEventListener("keydown", (event) => {
        if (suggestions.length === 0) {
            return;
        }

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                paintActive();
                break;
            case "ArrowUp":
                event.preventDefault();
                activeIndex =
                    (activeIndex - 1 + suggestions.length) % suggestions.length;
                paintActive();
                break;
            case "Enter":
                // A highlighted row commits directly; otherwise the form's own
                // submit handler resolves the raw query via findMatches.
                if (activeIndex >= 0 && activeIndex < suggestions.length) {
                    event.preventDefault();
                    choose(suggestions[activeIndex]);
                }
                break;
            case "Escape":
                close();
                break;
            default:
                break;
        }
    });

    return {
        refresh,
        close,
        getSuggestions: (): string[] => [...suggestions],
    };
}
