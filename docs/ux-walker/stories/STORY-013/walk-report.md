# STORY-013 — Use keyboard note navigation

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.
3. Completed step 3; screenshot: screenshots/step-3.png.

ArrowRight moved note focus; Enter left the focused note marked.

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: keyboard focus is outlined on the active note and its tooltip/inspector identifies F4 and its degree. The form grid and focus feedback remain visible.

## Mobile check (390×844)

State: Focused a fretboard note and sent ArrowRight. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The mobile screenshot shows note-focus emphasis on the board. The keyboard action was issued in the isolated browser.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `arrow-right` | [JSON](snapshots/geometry-arrow-right.json) | [PNG](screenshots/geometry-arrow-right.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `focused-note` | [JSON](snapshots/geometry-focused-note.json) | [PNG](screenshots/geometry-focused-note.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |
| `note-marked` | [JSON](snapshots/geometry-note-marked.json) | [PNG](screenshots/geometry-note-marked.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

