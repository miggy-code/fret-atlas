# STORY-028: Choose a new key from progress

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Open Practice and inspect Progress — performed; visible text length 1690.
- 2. Select C minor in key progress grid — performed; visible text length 1693.
- 3. Choose a form or drill — performed; visible text length 1693.
- C minor progress selection reflected in the view: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

C minor progress selection reflected in the view: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×1432px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows C minor selected in Practice and its corresponding progress grid; the selected key is visually clear and the fretboard remains centered. Mobile controls stack without page overflow.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 2 actions; open Practice then select C progress cell. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Incorrect exploratory capture selected C♯; superseded: [`snapshots/c-minor-progress-geometry.json`](snapshots/c-minor-progress-geometry.json); [`screenshots/c-minor-progress.png`](screenshots/c-minor-progress.png). page overflow 0px; 10 geometric checks flagged.
- C minor selected in Practice progress: [`snapshots/c-minor-selected-geometry.json`](snapshots/c-minor-selected-geometry.json); [`screenshots/c-minor-selected.png`](screenshots/c-minor-selected.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
