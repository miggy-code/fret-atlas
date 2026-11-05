# STORY-033: Trace a diagonal pattern

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Select Diagonal view — performed; visible text length 1294.
- 2. Select Rectangle family — performed; visible text length 1294.
- 3. Set neck length to 24 and inspect fit control — performed; visible text length 1368.
- Diagonal and Rectangle controls are present: true; fit control visible: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Diagonal and Rectangle controls are present: true; fit control visible: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×1122px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows a 24-fret Diagonal rectangle chain with Fit neck to screen visible; the continuation tones are shown as hollow markers and the board fits the desktop width. Mobile preserves string labels with the fit control.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 4 actions; Diagonal, family, inspect continuation, fit if needed. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Diagonal view selected: [`snapshots/diagonal-view-geometry.json`](snapshots/diagonal-view-geometry.json); [`screenshots/diagonal-view.png`](screenshots/diagonal-view.png). page overflow 0px; 6 geometric checks flagged.
- 24-fret diagonal rectangle chain; Fit neck control visible: [`snapshots/neck-24-geometry.json`](snapshots/neck-24-geometry.json); [`screenshots/neck-24.png`](screenshots/neck-24.png). page overflow 0px; 6 geometric checks flagged.
- Rectangle family chain selected: [`snapshots/rectangle-chain-geometry.json`](snapshots/rectangle-chain-geometry.json); [`screenshots/rectangle-chain.png`](screenshots/rectangle-chain.png). page overflow 0px; 6 geometric checks flagged.
- Final 24-fret chain (repeat capture): [`snapshots/reproduced-final-state-geometry.json`](snapshots/reproduced-final-state-geometry.json); [`screenshots/reproduced-final-state.png`](screenshots/reproduced-final-state.png). page overflow 0px; 6 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
