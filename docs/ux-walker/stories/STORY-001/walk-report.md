# STORY-001 — Identify the default position

**Status:** pass  
**Environment:** isolated Incognito preview at `http://localhost:4177/`, 1280×800; fresh private storage.

1. Opened the app. Header says A Minor pentatonic; controls show Key A, Scale Minor pentatonic, Position, and Form 1. Screenshot shows a balanced desktop board, consistent note circles, visible rectangle/stack legend, and no clipping or wrap. Geometry: page content extends below the captured viewport; the fretboard/controls are visible without horizontal overflow.
2. Hovered A4 at string 1, fret 5. Tooltip identifies A4, Root, Rectangle and a highlighted focus ring; the accessibility name carries degree 1 and root status. Screenshot confirms this feedback. No hesitation or extra steps.

## Flow Log

Completed in the catalog’s ideal 2 steps. No detours, re-entry, or ambiguity observed. No same-screen repeated information beyond the key/scale context used for orientation.

## Visual / Geometry Review

Visual review: the page has a clear header/controls hierarchy and aligned fretboard rows. Geometry audit at 1280×800 measured pageOverflowX=0. It flagged intentional unequal control widths and single-digit form buttons; screenshots show no wrap or visible misalignment. The board card reports a 9px spill heuristic, not apparent in the screenshot.

## Mobile check (390×844)

State: Fresh default Position/Form 1. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: At 390×844, the A minor header and study controls fit in the viewport; the board is horizontally scrollable and the visible fretboard portion remains contained.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 2 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `default` | [JSON](snapshots/geometry-default.json) | [PNG](screenshots/geometry-default.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `inspect-note` | [JSON](snapshots/geometry-inspect-note.json) | [PNG](screenshots/geometry-inspect-note.png) | 6 uneven-row heuristic flags; 1 content-spill heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

