# STORY-032: Compare rectangles and stacks in Position

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Choose Rectangles — performed; visible text length 1281.
- 2. Choose Stacks — performed; visible text length 1277.
- 3. Choose Both — performed; visible text length 1287.
- Pattern family controls are visible after returning to Both: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Pattern family controls are visible after returning to Both: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×1248px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows Both selected after cycling Rectangles and Stacks; shared pattern outlines remain distinct on the board. Mobile family controls remain usable without page-level horizontal scroll.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 3 actions; Rectangles, Stacks, Both. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Both pattern families restored: [`snapshots/both-geometry.json`](snapshots/both-geometry.json); [`screenshots/both.png`](screenshots/both.png). page overflow 0px; 11 geometric checks flagged.
- Final Both state (repeat capture): [`snapshots/both-patterns-geometry.json`](snapshots/both-patterns-geometry.json); [`screenshots/both-patterns.png`](screenshots/both-patterns.png). page overflow 0px; 11 geometric checks flagged.
- Rectangles only: [`snapshots/rectangles-geometry.json`](snapshots/rectangles-geometry.json); [`screenshots/rectangles.png`](screenshots/rectangles.png). page overflow 0px; 11 geometric checks flagged.
- Stacks only: [`snapshots/stacks-geometry.json`](snapshots/stacks-geometry.json); [`screenshots/stacks.png`](screenshots/stacks.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
