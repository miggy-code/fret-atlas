# STORY-016 — Read scale degrees on the map

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.

Intervals selected; note inspection uses fretboard role=button control.

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: interval labels replace note names on the scale tones while root and pattern colors remain identifiable. The board labels fit without mid-word wrap.

## Mobile check (390×844)

State: Intervals note view selected. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: Interval labels appear on the visible fretboard; the lower controls continue below the captured viewport.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 2 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `inspect-note` | [JSON](snapshots/geometry-inspect-note.json) | [PNG](screenshots/geometry-inspect-note.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |
| `interval-labels` | [JSON](snapshots/geometry-interval-labels.json) | [PNG](screenshots/geometry-interval-labels.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

