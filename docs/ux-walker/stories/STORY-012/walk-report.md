# STORY-012 — Mirror the board for a left-handed player

**Status:** pass. Isolated Playwright Chromium context; 1280×800.

1. Opened Settings. Screenshot: screenshots/step-1.png.
2. Enabled Left-handed; board orientation reversed. Screenshot: screenshots/step-2.png.
3. Closed Settings. Screenshot: screenshots/step-3.png.

Header orientation says Nut right. A 390×844 mobile screenshot is saved as `screenshots/mobile-check.png`.

## Flow Log

Story actions were performed in catalog order. No source changes were made.

## Visual / Geometry Review

Visual review: mirrored screenshot puts the nut on the right and reverses fret labels while preserving note geometry. At 390×844, the header/control rows wrap cleanly and page scrollWidth equals viewport width (390px); the fretboard remains in its own horizontal scroll area.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `left-handed-on` | [JSON](snapshots/geometry-left-handed-on.json) | [PNG](screenshots/geometry-left-handed-on.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `settings-closed` | [JSON](snapshots/geometry-settings-closed.json) | [PNG](screenshots/geometry-settings-closed.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `settings-open` | [JSON](snapshots/geometry-settings-open.json) | [PNG](screenshots/geometry-settings-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

