# V1 Step 3 — Initial Player Dataset

- STATUS: CLOSED
- PRIORITY: 50
- TAGS: data

Source: tasks/20260701-083457/TASK.md (V1 Task Breakdown), Task 3.

**Goal:** A small but real dataset to power the game.

**Data shape:**
```ts
interface PlayerEntry {
  id: string;
  name: string;
  clubs: string[]; // chronological order, first club first
}
```

**Checklist:**
- [x] Decide on data shape (`id`, `name`, `clubs[]`)
- [x] Create `src/data/players.json`
- [x] Keep club names as plain strings (no crests/IDs)
- [x] Write a tiny helper to pick a random player for a new game

**Current status (IN_PROGRESS):** `src/data/players.json` exists with 4 players (Neymar, Messi, Ronaldo, Mbappé). Remaining work:
1. **Bug — invalid JSON:** the file has trailing commas after each `clubs` array, so `JSON.parse` fails (`Expected double-quoted property name ... line 6`). Must be fixed before the data can be loaded at runtime.
2. No random-player picker helper exists yet.
3. Dataset is small — planning suggests 10–20 players (optional for V1).

