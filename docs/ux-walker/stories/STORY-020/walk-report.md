# STORY-020: Mark notes to compare later

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Click a fretboard note — performed; visible text length 1340.
- 2. Click a second fretboard note — performed; visible text length 1356.
- 3. Inspect and remove one mark — performed; visible text length 1330.
- Marked positions panel or clear action present: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Marked positions panel or clear action present: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×1407px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The desktop screenshot shows the fretboard and one saved marked position after removing the other; the mark row and Clear marks control align within the panel. The mobile board and mark list remain in the viewport column.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 3 actions; mark two notes, inspect, remove one. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Two marked positions (repeat capture): [`snapshots/mark-two-geometry.json`](snapshots/mark-two-geometry.json); [`screenshots/mark-two.png`](screenshots/mark-two.png). page overflow 0px; 12 geometric checks flagged.
- Two marked positions: [`snapshots/mark-two-notes-geometry.json`](snapshots/mark-two-notes-geometry.json); [`screenshots/mark-two-notes.png`](screenshots/mark-two-notes.png). page overflow 0px; 13 geometric checks flagged.
- One marked position remains: [`snapshots/remove-one-geometry.json`](snapshots/remove-one-geometry.json); [`screenshots/remove-one.png`](screenshots/remove-one.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
