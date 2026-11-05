# STORY-005 — Mark notes for a short study session

**Status:** pass. Isolated preview at desktop size.

1. Clicked A4 (string 1, fret 5) and C5 (string 1, fret 8). Both acquired marked outlines; accessibility state exposed both as marked.
2. Scrolled to the Marked positions section. It showed “2 marked positions” with A4 S1·F5 and C5 S1·F8 cards.
3. Selected Clear marks. The marked count and cards disappeared; saved workspace remained available.

## Flow Log

Completed in the intended 3 steps. Scrolling was needed to review/clear the marked-positions panel below the fretboard and Explore controls; this is ordinary page layout. No re-entry.

## Visual / Geometry Review

Visual review: marked positions receive a clear amber outline, while the two note locations remain distinguishable against the board. The marks panel is lower in the page flow and required scrolling to review/clear.

## Mobile check (390×844)

State: A4 and C5 marked through the fretboard controls; both marked states were confirmed. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: Both marked notes have visible emphasis on the board. The map and controls remain vertically stacked.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `marks-cleared` | [JSON](snapshots/geometry-marks-cleared.json) | [PNG](screenshots/geometry-marks-cleared.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `marks-reviewed` | [JSON](snapshots/geometry-marks-reviewed.json) | [PNG](screenshots/geometry-marks-reviewed.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `two-marks` | [JSON](snapshots/geometry-two-marks.json) | [PNG](screenshots/geometry-two-marks.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

