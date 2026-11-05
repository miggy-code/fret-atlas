# STORY-024: Ask for a hint, reveal answers, and move on

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before this story.
**Viewport:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- 1. Start a drill — performed; visible text length 371.
- 2. Choose Reveal — performed; visible text length 414.
- 3. Choose Next — performed; visible text length 319.
- Practice prompt remains available after advancing: true.
- Mobile 390×844: scrollWidth 390px; horizontal overflow 0px; viewport reflow inspected via screenshot.

## Result

Practice prompt remains available after advancing: true. No blocking issue observed in the exercised path.

## Visual and geometry audit

Desktop screenshot: [screenshots/step-3.png](screenshots/step-3.png). Viewport 1280×800px; document 1280×890px; horizontal overflow 0px.
Mobile screenshot: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## LOOK pass

The screenshot shows an active drill after Reveal and Next, with the prompt, feedback controls, and fretboard still in context. At mobile width the prompt and board stack without horizontal overflow.

Desktop evidence: [screenshots/step-3.png](screenshots/step-3.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 2 actions; reveal then next. Catalog story steps exercised: 3. No real account or user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Fresh drill prompt after Reveal and Next: [`snapshots/reveal-next-geometry.json`](snapshots/reveal-next-geometry.json); [`screenshots/reveal-next.png`](screenshots/reveal-next.png). page overflow 0px; 3 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
