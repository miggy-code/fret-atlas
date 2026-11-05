# STORY-017 — Isolate a scale degree, then restore the full scale

**Status:** pass. Isolated Playwright Chromium context; 1280×800.

1. Selected Scale degrees color mode. Screenshot: screenshots/step-1.png.
2. Selected C ♭3; isolated degree became active. Screenshot: screenshots/step-2.png.
3. Selected Show all degrees to restore the complete map. Screenshot: screenshots/step-3.png.

C ♭3 isolation is now cleared.

## Flow Log

Story actions were performed in catalog order. No source changes were made.

## Visual / Geometry Review

Visual review: Scale degrees colors map consistently to the chip row; selecting C ♭3 emphasizes that interval and Show all degrees restores the full map. No visible clipping or control wrap.

## Mobile check (390×844)

State: Scale degrees color mode selected and C flat third isolated. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The C flat-third chip is visibly selected and the board emphasizes matching degree notes.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `degree-colors` | [JSON](snapshots/geometry-degree-colors.json) | [PNG](screenshots/geometry-degree-colors.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `isolate-flat-third` | [JSON](snapshots/geometry-isolate-flat-third.json) | [PNG](screenshots/geometry-isolate-flat-third.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `show-all` | [JSON](snapshots/geometry-show-all.json) | [PNG](screenshots/geometry-show-all.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

