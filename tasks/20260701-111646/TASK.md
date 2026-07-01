# V2 Step 11 — Guess/Hint Info Panel

- STATUS: OPEN
- PRIORITY: 70
- TAGS: ux,polish

Source: tasks/20260701-105230/TASK.md (V2 Task Breakdown), Step 11.

**Goal:** A side panel that gives the current guess more visual weight than
a plain list item — club crest (if/when art assets exist) or at minimum a
cleaner card-style display of revealed clubs and past guesses, openable/
closable without losing game state.

**Reference:** `panel.ts` — the open/close/manually-closed state machine
(`openPanel` / `closePanel` / `closePanelManually` / `isPanelOpen`) is
generic and portable as-is. The *content* logic (`renderLastGuess`,
clade-tree "best hint" lookup) is specific to the source game's
species/clade tree and does **not** transfer — we have no clade-equivalent
hierarchy, just a flat chronological club list.

**Adapted approach for this game:**
- [ ] `src/ui/panel.ts`: copy the open/close state machine verbatim
- [ ] Replace `renderLastGuess` with something simpler: on each render,
      show a card for the most-recently-revealed club (name only, unless/
      until crest images are added) and/or a scrollable list of past wrong
      guesses (`view.pastGuesses`)
- [ ] Decide: auto-open on first hint (like the reference) or start closed
      and let the player opt in? Given this game has far fewer
      hints/screen real estate pressure than the source game, consider
      defaulting **open** and skip `manuallyClosedPanel` tracking entirely
      for V2 — simpler, revisit if it feels cluttered
- [ ] `createSpeciesCard`/`createCladeCard`/`mountCard` from `ui/card.ts` in
      the reference don't exist in this project — write a minimal
      `createClubCard(name)` / `createGuessCard(name)` instead, or skip
      cards entirely and just style list items for V2

**This is the lowest-confidence task in this doc** — worth a quick spike to
see if it earns its complexity before fully committing, since the
"clone the code" leverage that the other tasks get from their snippets is
much weaker here.
