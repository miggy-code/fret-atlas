# STORY-004 — Get help without losing the study state

**Status:** pass, with a delayed click. Isolated preview, desktop 1280×800.

1. The Guide button was not activated by the semantic locator; it opened on a coordinate click. The modal displays “Read the relationships” and the “Study one form at a time” section describing Position, Shape, Diagonal, plus other explanations. The dialog is centered, readable, and overlays the unchanged workspace.
2. Read the relevant explanation in the modal.
3. Closed with the X; the app returned to the same A minor Position/Form 1 workspace.

## Flow Log

The ideal is 3 steps. One retry was needed because the initial semantic click did not open the Guide; coordinate activation succeeded. This is an automation interaction hesitation, so not treated as product friction. No app detour observed.

## Visual / Geometry Review

Visual review: Guide is a centered, readable modal with a clear close control; its backdrop keeps the study visible but subdued. The long content continues below the viewport and remains scrollable.

## Mobile check (390×844)

State: Guide opened over the workspace. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The guide dialog fills most of the mobile viewport with its close control visible; the content continues vertically.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `guide-closed` | [JSON](snapshots/geometry-guide-closed.json) | [PNG](screenshots/geometry-guide-closed.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `guide-explanation` | [JSON](snapshots/geometry-guide-explanation.json) | [PNG](screenshots/geometry-guide-explanation.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `guide-open` | [JSON](snapshots/geometry-guide-open.json) | [PNG](screenshots/geometry-guide-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

