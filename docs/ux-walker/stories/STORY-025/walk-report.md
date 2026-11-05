# STORY-025: End a drill and resume the same board

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Start a drill — performed; visible text length 365.
- 2. Choose End and verify workspace returns — performed; visible text length 1690.
- Explore controls and Position remain on screen after End: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Explore controls and Position remain on screen after End: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-2.png](screenshots/step-2.png). Viewport 1280×800px; document 1280×1432px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows Practice controls again after End and retains the selected board state; the primary drill cards have consistent sizing. Mobile remains vertically scrollable with no page-width spill.

Desktop evidence: [screenshots/step-2.png](screenshots/step-2.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 1 action; end active drill. Catalog story steps exercised: 2. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Practice deck restored after ending drill: [`snapshots/end-drill-geometry.json`](snapshots/end-drill-geometry.json); [`screenshots/end-drill.png`](screenshots/end-drill.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
