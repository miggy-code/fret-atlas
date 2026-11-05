# STORY-002 — Move between pentatonic forms

**Status:** pass. **Viewport:** 1280×800, isolated Incognito preview.

1. Initial map shows Form 1 at frets 5–8.
2. Clicked Form 2. It becomes active and the fret range updates to frets 7–10; the pattern map moves accordingly. Screenshot shows consistent note/outline sizing and no horizontal page overflow.
3. Clicked Form 1; the original selected form and 5–8 range return.

## Flow Log

Completed in the ideal 3 steps. Picker controls are labeled and direct selection did not require hunting. No detours or re-entry. Geometry appears consistent in inspected desktop captures.

## Visual / Geometry Review

Visual review: Form 2 moved the red/blue pattern geometry and its fret range; control and note shapes remain consistent. No visible text wrap or horizontal page overflow.

## Mobile check (390×844)

State: Form 2 selected. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The Form 2 control is selected and its board shape is visible at mobile width; the fretboard remains horizontally scrollable.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `form-1-restored` | [JSON](snapshots/geometry-form-1-restored.json) | [PNG](screenshots/geometry-form-1-restored.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `form-1` | [JSON](snapshots/geometry-form-1.json) | [PNG](screenshots/geometry-form-1.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `form-2` | [JSON](snapshots/geometry-form-2.json) | [PNG](screenshots/geometry-form-2.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

