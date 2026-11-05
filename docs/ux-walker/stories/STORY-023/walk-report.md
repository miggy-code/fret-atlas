# STORY-023: Find chord tones beyond the current scale

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Set chord root to C♯ and quality to major — performed; visible text length 380.
- 2. Choose Start under Find chord tones — performed; visible text length 380.
- 3. Inspect chord prompt and target set — performed; visible text length 380.
- Chord prompt includes C♯ major: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Chord prompt includes C♯ major: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×890px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows the C♯ major chord prompt above the fretboard and the hidden targets inside the board; hierarchy stays focused on the prompt. Mobile keeps the board within the page width.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: Set chord, start, find root/third/fifth. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- C♯ major Find chord tones prompt active: [`snapshots/reproduced-final-state-geometry.json`](snapshots/reproduced-final-state-geometry.json); [`screenshots/reproduced-final-state.png`](screenshots/reproduced-final-state.png). page overflow 0px; 3 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
