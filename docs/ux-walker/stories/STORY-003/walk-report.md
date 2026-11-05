# STORY-003 — Learn what the colored outlines mean

**Status:** pass. Desktop 1280×800, isolated Incognito preview.

1. The fretboard legend labels Rectangles in red and Stacks in blue; both are visible.
2. Selected Rectangles. The toggle becomes active and only red rectangle geometry is rendered.
3. Selected Both. The toggle returns active and both overlay families render again.

Inspected screenshots show matching note sizes, alignment and spacing; no clipping, wrapped controls, or page horizontal overflow.

## Flow Log

Completed in the ideal 3 steps; no hesitation or repeated information noticed.

## Visual / Geometry Review

Visual review: the red rectangle and blue stack overlays are easy to distinguish in the legend and board. Pattern filtering preserves the fretboard grid and note alignment.

## Mobile check (390×844)

State: Rectangles pattern filter selected. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The rectangle filter is visibly selected; control groups remain stacked and readable at this width.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `both-restored` | [JSON](snapshots/geometry-both-restored.json) | [PNG](screenshots/geometry-both-restored.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `both` | [JSON](snapshots/geometry-both.json) | [PNG](screenshots/geometry-both.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `rectangles` | [JSON](snapshots/geometry-rectangles.json) | [PNG](screenshots/geometry-rectangles.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

