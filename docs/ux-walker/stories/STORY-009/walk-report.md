# STORY-009 — Restore only a changed configuration panel

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.
3. Completed step 3; screenshot: screenshots/step-3.png.

Restored Skeleton to unchecked default; A minor key/scale remain.

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: Restore defaults resets the changed module and removes its Changed state. The panel remains aligned; no layout spill or wrapped labels are visible.

## Mobile check (390×844)

State: Changed Skeleton setting restored with Restore defaults. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The Overlays panel shows the default state at mobile width; its controls remain stacked without horizontal page spill.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 2 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `changed-overlays` | [JSON](snapshots/geometry-changed-overlays.json) | [PNG](screenshots/geometry-changed-overlays.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `defaults-restored` | [JSON](snapshots/geometry-defaults-restored.json) | [PNG](screenshots/geometry-defaults-restored.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

