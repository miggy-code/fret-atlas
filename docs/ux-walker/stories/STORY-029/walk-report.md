# STORY-029: Preserve progress across a reload

**Walk status:** pass
**Session:** isolated Playwright context; local and session storage cleared before the story.
**Viewport:** 1280×800 desktop and 390×844 mobile check.

## Walk log

- Finish Play through to earn one form credit.
- Reload the page, then open Practice.
- Confirm A minor retains 1 of 5 practiced forms.
- Verified final state: 1 of 5 forms remains after reload: true

## Visual and geometry audit

Viewed [screenshots/reload-progress.png](screenshots/reload-progress.png). Desktop document dimensions: 1280×1456px in a 1280×800px viewport; page-level horizontal overflow: 0px. The fretboard retains its own horizontal scrolling.

## LOOK pass

The screenshot shows the A minor progress count at 1 of 5 after reload; the selected key and progress grid remain aligned. Mobile retains the same progress summary in a vertical layout.

Desktop evidence: [screenshots/reload-progress.png](screenshots/reload-progress.png). Mobile evidence: [screenshots/mobile-check.png](screenshots/mobile-check.png).

## Flow economy

Catalog ideal: 2 actions; reload and open Practice. Actions were exercised in the isolated browser context. No real data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Exploratory reload capture; superseded: [`snapshots/reloaded-progress-geometry.json`](snapshots/reloaded-progress-geometry.json); [`screenshots/reloaded-progress.png`](screenshots/reloaded-progress.png). page overflow 0px; 11 geometric checks flagged.
- Reloaded practice deck retains 1 of 5 progress: [`snapshots/reloaded-progress-verified-geometry.json`](snapshots/reloaded-progress-verified-geometry.json); [`screenshots/reloaded-progress-verified.png`](screenshots/reloaded-progress-verified.png). page overflow 0px; 11 geometric checks flagged.
- Exploratory seed capture before corrected reload; superseded: [`snapshots/seed-progress-and-reload-geometry.json`](snapshots/seed-progress-and-reload-geometry.json); [`screenshots/seed-progress-and-reload.png`](screenshots/seed-progress-and-reload.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
