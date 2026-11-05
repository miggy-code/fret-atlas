# STORY-010 — Return to a saved workspace

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.

Reload restored focus range (true) and A4 mark (true).

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: after reload the fretboard and marked A4 focus state return with the configured range. The mark uses a visible outline and the page retains its normal control hierarchy.

## Mobile check (390×844)

State: Configured fret range and A4 mark, then reloaded the isolated browser page. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: After reload, the Focus range remains enabled and the saved workspace is displayed. The map is horizontally scrollable.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 2 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `configured` | [JSON](snapshots/geometry-configured.json) | [PNG](screenshots/geometry-configured.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |
| `reloaded` | [JSON](snapshots/geometry-reloaded.json) | [PNG](screenshots/geometry-reloaded.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

