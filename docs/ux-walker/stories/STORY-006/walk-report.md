# STORY-006 — Narrow practice to a fret range and strings

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.
3. Completed step 3; screenshot: screenshots/step-3.png.
4. Completed step 4; screenshot: screenshots/step-4.png.

Fret range enabled at 5–9; Include string 4/5/6 pressed state false,false,false.

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: fret-range inputs and six string toggles form a compact row; excluded strings 4–6 are visually de-emphasized. The page is vertically scrollable; no horizontal page overflow is visible.

## Mobile check (390×844)

State: Focus opened, fret range set to 5–9, strings 4–6 excluded. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The range inputs and six string controls remain visible in the Focus panel; the board is horizontally scrollable.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 4 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `focus-open` | [JSON](snapshots/geometry-focus-open.json) | [PNG](screenshots/geometry-focus-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `range-5-9` | [JSON](snapshots/geometry-range-5-9.json) | [PNG](screenshots/geometry-range-5-9.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `range-enabled` | [JSON](snapshots/geometry-range-enabled.json) | [PNG](screenshots/geometry-range-enabled.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `strings-1-3` | [JSON](snapshots/geometry-strings-1-3.json) | [PNG](screenshots/geometry-strings-1-3.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

