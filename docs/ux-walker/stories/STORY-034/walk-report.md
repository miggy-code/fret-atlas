# STORY-034: Reveal adjacent positions while staying in context

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before the story.
**Viewports:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- Enable Connect positions in Position view.
- Hover a note near the boundary; the neighboring forms appear as violet ghost outlines while the active form remains solid.

## Visual and geometry audit

Viewed [screenshots/step-2.png](screenshots/step-2.png). Violet neighboring outlines are visible without obscuring the active form; the neighboring tones remain distinguishable. At mobile width the ghost forms stay on the board with no page-level horizontal overflow.

## Flow economy

Catalog ideal: 2 steps. Both steps completed. No real data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Boundary note hovered with neighboring ghost forms visible: [`snapshots/boundary-hover-geometry.json`](snapshots/boundary-hover-geometry.json); [`screenshots/boundary-hover.png`](screenshots/boundary-hover.png). page overflow 0px; 11 geometric checks flagged.
- Connect positions enabled: [`snapshots/connect-positions-geometry.json`](snapshots/connect-positions-geometry.json); [`screenshots/connect-positions.png`](screenshots/connect-positions.png). page overflow 0px; 11 geometric checks flagged.
- Connected forms (repeat capture): [`snapshots/connected-geometry.json`](snapshots/connected-geometry.json); [`screenshots/connected.png`](screenshots/connected.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
