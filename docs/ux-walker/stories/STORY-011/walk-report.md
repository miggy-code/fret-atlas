# STORY-011 — Configure an all-fourths neck

**Status:** pass. Isolated Playwright Chromium context; 1280×800.

1. Opened Settings. Screenshot: screenshots/step-1.png.
2. Enabled All fourths. Screenshot: screenshots/step-2.png.
3. Closed Settings and inspected the neck. Screenshot: screenshots/step-3.png.

Warp guide count after tuning change: 0.

## Flow Log

Story actions were performed in catalog order. No source changes were made.

## Visual / Geometry Review

Visual review: All fourths removes the G–B warp guide and updates the string labels. The board remains aligned and all tuning controls are reachable.

## Mobile check (390×844)

State: Settings opened and All fourths enabled. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The Settings dialog fits within the mobile viewport with the All fourths control visible.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `all-fourths-on` | [JSON](snapshots/geometry-all-fourths-on.json) | [PNG](screenshots/geometry-all-fourths-on.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `settings-closed` | [JSON](snapshots/geometry-settings-closed.json) | [PNG](screenshots/geometry-settings-closed.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `settings-open` | [JSON](snapshots/geometry-settings-open.json) | [PNG](screenshots/geometry-settings-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

