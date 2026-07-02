---
title: Default box-sizing content-box breaks flex and absolute layout math
date: 2026-07-02
category: ui-bugs
module: src/style.css (game card + hint-panel career-path timeline)
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Horizontal scroll / overflow of the game card on mobile viewports (<=820px stacked layout)"
  - "Career-path timeline node dot rendered a few px right of the dashed vertical rail (visually off-center)"
  - "Revealed clubs rendered twice (game card and hint-panel career path)"
root_cause: config_error
resolution_type: config_change
severity: medium
related_components:
  - src/index.html
  - src/ui/mountGame.ts
  - src/ui/panel.ts
tags: [css, box-sizing, border-box, flexbox, layout, mobile-overflow, hint-panel, responsive]
---

# Default box-sizing content-box breaks flex and absolute layout math

## Problem

Two distinct CSS layout bugs surfaced during the PR #3 UI/UX polish pass, and both traced back to a single root cause: the browser default `box-sizing: content-box` breaks layout arithmetic the moment an element combines a declared width/height with padding and/or borders. Under `content-box`, the `width` and `height` you write describe the *content* box only — any padding and border are added *on top* of that number, so the element renders wider and taller than its declared size. When downstream layout math (a `width:100%` flex child, or a decorative dot positioned by computed offsets) assumes the declared size equals the rendered size, the element lands in the wrong place.

The two concrete failures were:

1. **Mobile horizontal overflow** — the main game card (`.game`) spilled past the viewport on narrow screens, producing horizontal scroll and preventing the card from scaling down cleanly.
2. **Career-path timeline dot misalignment** — the round team-indicator dot on each career-path card sat a few pixels to the right of the vertical dashed rail it was supposed to be centered on.

## Symptoms

- On narrow / mobile viewport widths, the game card was visibly wider than the screen. A horizontal scrollbar appeared, and the card refused to shrink to fit — it stayed at an oversized fixed rendered width instead of tracking the container.
- On the hint panel's career path, every club card's round dot appeared offset ~2px to the right of the dashed vertical rail. The dot and rail were meant to be concentric; instead the rail visibly ran through the left portion of the dot rather than its center. The effect read as "slightly off" / not crisp.

## What Didn't Work

The dot misalignment initially looked like a trivial "nudge it left a couple pixels" fix — adjust the dot's `left` offset and move on. This diagnostic dead end is worth recording, because chasing it would have produced a fix that looked right at one zoom level and drifted at others.

The reason nudging alone fails: the dot was declared `width:9px` with a `2px` border under default content-box, so it actually rendered `9 + 2 + 2 = 13px` wide. Its visual center therefore sat at `left + 13/2`, not the `left + 9/2` the offsets had been eyeballed against. Simply shifting `left` compensates for the symptom at a single moment but leaves the *center* math wrong — the declared and rendered widths still disagree, so any later edit to border width or dot size reintroduces the drift.

The productive diagnostic move was to stop eyeballing an edge offset and instead **solve for a shared center x-coordinate**, which forced two facts into the open: (a) the rail's `left` and the dot's `left` were measured from *different* coordinate frames (different containing blocks), and (b) content-box inflation meant the dot's true width was 13px, not 9px. Only after naming both did a stable fix exist.

## Solution

**Bug 1 — game card overflow.** Make `width:100%` include the padding by switching the card to `border-box`.

Before:

```css
.game {
  width: 100%;
  max-width: 480px;
  padding: 24px;
}
```

After:

```css
.game {
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  padding: 24px;
}
```

**Bug 2 — timeline dot centering.** Fix both the content-box inflation (via `border-box` on the dot) and the coordinate-frame mismatch (by solving both centers to the same absolute x = 8px).

Before:

```css
.hint-panel__clubs::before {
  left: 6px;
  width: 2px;
  /* vertical dashed rail */
}

.hint-card::before {
  left: -16px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--bg-dark);
  border-radius: 50%;
}
```

After:

```css
.hint-panel__clubs::before {
  left: 7px;   /* rail center now at x = 8px (7 + half of 2px width) */
  width: 2px;
}

.hint-card::before {
  box-sizing: border-box;
  left: -18px;
  width: 10px;
  height: 10px;
  border: 2px solid var(--bg-dark);
  border-radius: 50%;
  /* target center x = 8px, shared with the rail above */
}
```

Center math for the dot: the list container `.hint-panel__clubs` has `padding-left: 20px`, and each `.hint-card` carries a `1px` border, so a card's padding box starts at `20 + 1 = 21px` from the list's edge. With `left: -18px`, the dot's left edge lands at `21 - 18 = 3px`. Because the dot is now `border-box` at `10px` wide, its true rendered width is 10px, so its center is at `3 + 5 = 8px`. The rail's `left: 7px` plus half its `2px` width also centers at `8px`. Both centers coincide at x = 8px.

Verification was done by running the app and capturing a 3x-magnified headless Chromium screenshot (`--force-device-scale-factor=3`), which showed the dashed rail passing cleanly through the center of the dot.

## Why This Works

`box-sizing: border-box` redefines what the `width`/`height` values *mean*: they now describe the border box (content + padding + border) rather than the content box. This is the root fix for both bugs.

- **Bug 1:** Under content-box, `width:100%` sizes the *content* to 100% of the container and then adds `24px * 2` of padding on top, so the rendered card is `container + 48px` — wider than its parent. Critically, the card is a flex-**column** child of `.game-layout` (the layout stacks vertically at ≤820px). A flex item's *main-axis* size shrinks to fit, but here width is the *cross axis* of a column, and cross-axis size does not shrink-to-fit — so nothing pulled the oversized card back and it overflowed. Switching to `border-box` makes `width:100%` mean "the whole card, padding included, equals 100% of the container," so it fits exactly with no overflow.

- **Bug 2:** Two errors compounded. First, **content-box inflation** made the declared 9px dot render at 13px, shifting its true center ~2px right of where the offsets assumed. Second, a **coordinate-frame mismatch**: the rail's `left` was measured from the list's padding box while the dot's `left` was measured from each card's padding box, and those two origins differ by the list's 20px padding plus the card's 1px border. The two `left` values had been tuned independently and never resolved to the same absolute x. The fix eliminates the inflation (`border-box` → declared width is the rendered width) and then computes both centers in absolute page terms, landing them both at x = 8px.

## Prevention

- **Default to `border-box` whenever declared size must include padding/border for layout math.** This is essential for `width:100%` (or `height:100%`) flex/grid children that also have padding, and for bordered decorative pseudo-elements positioned by computed offsets. The durable, project-wide preventive is the global baseline reset:

  ```css
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  ```

  Adopting this once removes an entire class of "off by the padding/border" bugs rather than patching them element by element.

- **When aligning an absolutely-positioned decoration to a rail or guide, align *centers*, not edges, and compute both centers in the *same* coordinate frame.** If the two elements live in different containing blocks, convert their offsets into a common origin before comparing. Record the target center coordinate in a code comment (e.g. `/* target center x = 8px, shared with the rail */`) so future edits to size, border, or padding don't silently drift the alignment.

- **Verify pixel alignment in coverage-excluded DOM/CSS (`src/ui/**`) by running the app and inspecting a magnified screenshot** (`--force-device-scale-factor=3` under headless Chromium). Unit tests are excluded here by design and will never catch a 2px offset; a magnified screenshot makes sub-pixel drift obvious.

- **Avoid rendering the same data in two regions.** Secondary cleanup in this PR: the revealed clubs had been rendered twice — once in the game card (`#clubs`) and once in the hint-panel career path. The duplicate game-card copy, its dead `.game__clubs` CSS, and the now-unused `--fs-club` token were removed. Rendering one dataset in two places doubles the layout surface area for exactly these kinds of box-model bugs; keep a single source of truth in the DOM.

## Related Issues

- `docs/solutions/tooling-decisions/github-pages-project-subpath-public-path.md` — the other frontend/tooling learning in this repo (webpack `PUBLIC_PATH` for GitHub Pages subpath deploys). Unrelated root cause; listed only as the sibling solutions doc.
- No matching GitHub issues found.
