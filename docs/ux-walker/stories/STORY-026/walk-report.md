# STORY-026: Earn credit by playing Form 1

**Walk status:** pass
**Session:** isolated Playwright context; local and session storage cleared before the story.
**Viewport:** 1280×800 desktop and 390×844 mobile check.

## Walk log

- Open Practice; deck says Practicing A minor in Form 1.
- Select Play through and wait until playback stops.
- Form count updates to 1 of 5.
- Verified final state: 1 of 5 forms practiced: true

## Visual and geometry audit

Viewed [screenshots/completed-playthrough.png](screenshots/completed-playthrough.png). Desktop document dimensions: 1280×1456px in a 1280×800px viewport; page-level horizontal overflow: 0px. The fretboard retains its own horizontal scrolling.

## LOOK pass

The screenshot shows the Practice deck after playback completes and the A minor progress summary at 1 of 5; the four drill cards align consistently. Mobile cards stack cleanly.

Desktop evidence: [screenshots/completed-playthrough.png](screenshots/completed-playthrough.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 2 actions; open Practice then play through. Actions were exercised in the isolated browser context. No real data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Play-through complete; Form 1 progress is 1 of 5: [`snapshots/completed-play-through-geometry.json`](snapshots/completed-play-through-geometry.json); [`screenshots/completed-play-through.png`](screenshots/completed-play-through.png). page overflow 0px; 11 geometric checks flagged.
- Play-through in progress (not completion): [`snapshots/play-through-geometry.json`](snapshots/play-through-geometry.json); [`screenshots/play-through.png`](screenshots/play-through.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
