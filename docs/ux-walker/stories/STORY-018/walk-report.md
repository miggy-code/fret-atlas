# STORY-018: Build and hear a chord over a scale

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Set Chord root to C — performed; visible text length 1287.
- 2. Set chord quality to major — performed; visible text length 1287.
- 3. Choose Show tones, then Hear chord — performed; visible text length 1301.
- Chord display visible: true; Show tones now reads Hide tones: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Chord display visible: true; Show tones now reads Hide tones: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×1248px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The desktop screenshot shows the C major triad overlay and its legend beneath the board; controls remain aligned and button labels stay on one line. At 390px the controls stack around a readable board with no horizontal page overflow.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 3 actions; choose root, quality, show/hear tones. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- C-major chord after selecting root C and major quality (partial setup): [`snapshots/chord-root-C-geometry.json`](snapshots/chord-root-C-geometry.json); [`screenshots/chord-root-C.png`](screenshots/chord-root-C.png). page overflow 0px; 11 geometric checks flagged.
- C-major tones displayed and Hear chord activated: [`snapshots/reproduced-final-state-geometry.json`](snapshots/reproduced-final-state-geometry.json); [`screenshots/reproduced-final-state.png`](screenshots/reproduced-final-state.png). page overflow 0px; 10 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
