/**
 * Normalize a name for comparison: trim surrounding whitespace, lowercase,
 * collapse internal whitespace runs to a single space, and strip diacritics
 * so that e.g. "Mbappé" and "Mbappe" compare equal.
 */
export function normalizeName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
}

/**
 * Case-, whitespace-, and accent-insensitive comparison of two full names.
 */
export function namesMatch(guess: string, actual: string): boolean {
    return normalizeName(guess) === normalizeName(actual);
}

/* -------------------------------------------------------------------------- */
/* Fuzzy matching                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Does every character of `query` appear in `text`, in order (but not
 * necessarily contiguously)? This is a classic subsequence test and is what
 * makes "lmess" match "lionel messi" (l → m → e → s → s all appear in order),
 * while "messss" does not (there is no run of enough s's left after "messi").
 *
 * Both inputs are expected to be pre-normalized. An empty query never matches.
 */
function isSubsequence(query: string, text: string): boolean {
    if (query.length === 0) {
        return false;
    }
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) {
            qi++;
        }
    }
    return qi === query.length;
}

/**
 * Score how well a (normalized) query fuzzy-matches a (normalized) candidate
 * name. Higher is better; a non-positive score means "not a match at all".
 *
 * Tiers, best to worst:
 *   4 — exact match
 *   3 — candidate starts with the query ("mess" → "messi ...")
 *   2 — query appears as a contiguous substring ("messi" in "lionel messi")
 *   1 — query is an ordered subsequence ("lmess" spread across "lionel messi")
 *   0 — no match
 *
 * Within a tier, shorter candidates rank slightly higher so the tightest match
 * wins ties (e.g. a query that could match several names prefers the closest).
 */
export function fuzzyMatchScore(
    normalizedQuery: string,
    normalizedCandidate: string
): number {
    if (normalizedQuery.length === 0) {
        return 0;
    }

    const tier = matchTier(normalizedQuery, normalizedCandidate);
    if (tier === 0) {
        return 0;
    }

    // Tie-break toward shorter candidates without ever crossing into the next
    // tier down (the length bonus is strictly < 1).
    const lengthBonus = 1 / (1 + normalizedCandidate.length);
    return tier + lengthBonus;
}

/** Classify how `query` matches `candidate`; 0 means no match. See tiers above. */
function matchTier(query: string, candidate: string): number {
    if (candidate === query) {
        return 4;
    }
    if (candidate.startsWith(query)) {
        return 3;
    }
    if (candidate.includes(query)) {
        return 2;
    }
    if (isSubsequence(query, candidate)) {
        return 1;
    }
    return 0;
}

/**
 * A single scored suggestion produced by {@link findMatches}: the original,
 * display-cased `name` plus its `score`.
 */
export interface NameMatch {
    name: string;
    score: number;
}

/**
 * Pure, DOM-free autocomplete core: given the full list of candidate names and
 * a raw query, return the matching names (best first). Names in `exclude`
 * (compared accent/case/space-insensitively) are dropped — this is how
 * already-guessed players are kept out of the suggestions.
 *
 * An empty/whitespace-only query yields no matches.
 */
export function findMatches(
    names: string[],
    query: string,
    exclude: string[] = []
): NameMatch[] {
    const normalizedQuery = normalizeName(query);
    if (normalizedQuery.length === 0) {
        return [];
    }

    const excluded = new Set(exclude.map(normalizeName));

    const matches: NameMatch[] = [];
    for (const name of names) {
        const normalizedName = normalizeName(name);
        if (excluded.has(normalizedName)) {
            continue;
        }
        const score = fuzzyMatchScore(normalizedQuery, normalizedName);
        if (score > 0) {
            matches.push({ name, score });
        }
    }

    // Highest score first; stable-ish alphabetical tiebreak for determinism.
    matches.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return matches;
}

/**
 * Resolve a raw user query to the single best real player name, or `null` when
 * nothing matches well enough. This is the gate that stops invalid input (e.g.
 * "messss") from ever reaching the game: only names that survive
 * {@link findMatches} are allowed, and the top-ranked one is chosen.
 *
 * Already-guessed names are excluded, so re-typing a past guess resolves to the
 * next-best real candidate (or `null`) rather than silently re-submitting it.
 */
export function resolveGuess(
    names: string[],
    query: string,
    exclude: string[] = []
): string | null {
    const matches = findMatches(names, query, exclude);
    return matches.length > 0 ? matches[0].name : null;
}
