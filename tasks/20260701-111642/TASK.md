# V2 Step 7 — Autocomplete for Guess Input

- STATUS: CLOSED
- PRIORITY: 90
- TAGS: ux,input

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 7.

**Goal:** Replace the bare text input with a type-ahead dropdown so players
pick from real player names instead of hoping their spelling matches, and so
they can't accidentally re-guess someone already guessed.

**Reference:** `autocomplete.ts` (species-name autocomplete) — pattern
transfers almost directly:
- `speciesNames: string[]` → `playerNames: string[]` (derive once from the
  loaded dataset, e.g. `players.map(p => p.name)`)
- `isGuessed(name)` → check against `view.pastGuesses` from `GameView`
  (Step 4's `toView()` already exposes this)
- Keep the debounce-free `input`/`focus`/`blur` + arrow-key/Enter navigation
  as-is; it's UI-only and framework-agnostic

**Scope change (approved):** the original checklist said "case-insensitive
substring match is enough — no fuzzy matching (out of scope per V1 README)".
That decision was **reversed by request**: a guess must resolve to a real
player via _fuzzy_ matching, and anything that doesn't match a real name is
rejected silently (the input is just cleared — no alert, no wasted guess).
See "Behavior implemented" below.

**Behavior implemented:**
- Only names present in the dataset can ever reach the game. Raw input is
  fuzzy-resolved to the single best real name; if nothing matches, the guess
  is swallowed (input cleared, no count, no hint).
- Fuzzy matching is normalized (case/whitespace/accent-insensitive, reusing
  `normalizeName`) and tiered, best-first:
  exact > prefix > substring > ordered subsequence.
  - `"Messi"` → `Lionel Messi` (prefix/substring)
  - `"LMess"` → `Lionel Messi` (subsequence: l→m→e→s→s in order)
  - `"Mbappe"` / `"mbappe"` → `Kylian Mbappé` (accent + case normalized)
  - `"Messss"` → no match → rejected
- Already-guessed names are excluded from both the dropdown and resolution,
  so a past guess can't be re-submitted.
- Enter with a highlighted suggestion commits it; Enter with none falls back
  to fuzzy-resolving the raw text (then submits or clears).

**Checklist:**
- [x] Add `#autocomplete-box` (a `div`) next to `#guess-input` in
      `src/index.html`, positioned via CSS (`position: absolute`). The input
      is wrapped in a `.game__input-wrap` (`position: relative`) so the box
      anchors to it.
- [x] New `src/ui/autocomplete.ts`: `setupAutocomplete()` with signature
      `{ inputEl, autocompleteBox, playerNames, isGuessed, onSelect }`,
      returning a small controller (`refresh` / `close` / `getSuggestions`).
- [x] Wire into `mountGame.ts`: `onSelect` populates the input and
      **auto-submits** (confirmed as the desired UX).
- [x] ~~Case-insensitive substring match~~ → **fuzzy** match (see scope
      change above): exact/prefix/substring/subsequence, all normalized.
- [x] Filter out already-guessed names from suggestions **and** from
      resolution (avoids wasting a guess re-submitting the same name).
- [x] Mobile check: dropdown is `position: absolute` within the input wrap,
      spans the input's width (`left/right: 0`), and scrolls internally
      (`max-height` + `overflow-y`) so it can't run off-screen.
- [x] Tests: `test/autocomplete.test.ts` covers the pure `findMatches` /
      `fuzzyMatchScore` / `resolveGuess` logic, including every worked
      example above (DOM-free).

**Note:** the pure filter/match/resolve functions (`fuzzyMatchScore`,
`findMatches`, `resolveGuess`) live in `src/matching.ts` — DOM-free and
unit-tested; `src/ui/autocomplete.ts` holds only the DOM wiring (rendering,
focus/blur, keyboard nav) and stays excluded from coverage, same split as
Step 4's reducer/facade.
