# STORY-022: Practice selected scale degrees with assistance

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before the story.
**Viewports:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- Open Practice; select root A and flat third C in Find scale degrees.
- Choose Find selected degrees; the prompt identifies C (♭3) and the board hides the answers.
- Choose Hint, then Reveal and Next; the round shows assisted feedback and a fresh prompt.

## Visual and geometry audit

Viewed [screenshots/step-3.png](screenshots/step-3.png). The prompt, progress indicators, assistance actions, and fretboard remain in the same context; no wrapped controls or page-level horizontal overflow were observed. The mobile version stacks the prompt and board vertically.

## Flow economy

Catalog ideal: 4 steps. The live interface labels the launch action Find selected degrees and has no separate Start button. No real data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Practice deck opened: [`snapshots/practice-assistance-geometry.json`](snapshots/practice-assistance-geometry.json); [`screenshots/practice-assistance.png`](screenshots/practice-assistance.png). page overflow 0px; 11 geometric checks flagged.
- Selected degree prompt after Hint, Reveal, and Next: [`snapshots/reproduced-final-state-geometry.json`](snapshots/reproduced-final-state-geometry.json); [`screenshots/reproduced-final-state.png`](screenshots/reproduced-final-state.png). page overflow 0px; 3 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
