# STORY-007 — Reduce visual context around a position

**Status:** pass. Isolated Playwright Chromium context; 1280×800.

1. Opened Overlays panel. Screenshot: screenshots/step-1.png.
2. Enabled Skeleton; root-note guides are on. Screenshot: screenshots/step-2.png.
3. Turned off Notes outside the scale while Whole map remained off. Screenshot: screenshots/step-3.png.

Skeleton checked; Notes outside the scale and Whole map unchecked.

## Flow Log

Story actions were performed in catalog order. No source changes were made.

## Visual / Geometry Review

Visual review: Skeleton connects roots across the board in red, while the position patterns stay distinct in red/blue. The open Overlays panel is consistently aligned and shows a Changed badge.

## Mobile check (390×844)

State: Overlays opened with Skeleton enabled and Notes outside the scale disabled. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The Skeleton checkbox is on and the surrounding-note option is off; panel labels remain readable.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `context-off` | [JSON](snapshots/geometry-context-off.json) | [PNG](screenshots/geometry-context-off.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `overlays-open` | [JSON](snapshots/geometry-overlays-open.json) | [PNG](screenshots/geometry-overlays-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `skeleton-on` | [JSON](snapshots/geometry-skeleton-on.json) | [PNG](screenshots/geometry-skeleton-on.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

