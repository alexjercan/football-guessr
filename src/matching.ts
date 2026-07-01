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
