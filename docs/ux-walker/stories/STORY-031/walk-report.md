# STORY-031: Isolate one rectangle shape

**Walk status:** pass
**Session:** isolated Playwright context; browser state cleared before the story.
**Viewports:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- Select Shape in Study view.
- Choose Rectangle in Shape family.
- Use Next shape; Form 2 becomes active and the rectangle changes to the next instance.

## Visual and geometry audit

Viewed [screenshots/shape-advanced.png](screenshots/shape-advanced.png). The rectangle outline remains readable and the selected Form 2 control is clear. At mobile width, controls stack above the board without page-level horizontal overflow.

## Flow economy

Catalog ideal: 3 steps. The live control is named Next shape rather than Next form; it advances the active shape as intended. No real data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Reproduction status: complete for the states listed below.

- Next rectangle shape selected: [`snapshots/next-shape-geometry.json`](snapshots/next-shape-geometry.json); [`screenshots/next-shape.png`](screenshots/next-shape.png). page overflow 0px; 11 geometric checks flagged.
- Rectangle family selected: [`snapshots/rectangle-family-geometry.json`](snapshots/rectangle-family-geometry.json); [`screenshots/rectangle-family.png`](screenshots/rectangle-family.png). page overflow 0px; 11 geometric checks flagged.
- Final shape state (repeat capture): [`snapshots/shape-rectangle-next-geometry.json`](snapshots/shape-rectangle-next-geometry.json); [`screenshots/shape-rectangle-next.png`](screenshots/shape-rectangle-next.png). page overflow 0px; 11 geometric checks flagged.
- Shape view selected: [`snapshots/shape-view-geometry.json`](snapshots/shape-view-geometry.json); [`screenshots/shape-view.png`](screenshots/shape-view.png). page overflow 0px; 11 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
