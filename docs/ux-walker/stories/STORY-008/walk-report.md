# STORY-008 — Hide pattern outlines on excluded strings

**Status:** pass. Isolated Playwright Chrome context, desktop 1280×800.

1. Completed step 1; screenshot: screenshots/step-1.png.
2. Completed step 2; screenshot: screenshots/step-2.png.

Pattern string buttons 1 and 2 pressed states: false,false; fretboard note controls remain (78).

## Flow Log

Completed in catalog order using the visible controls.

## Visual / Geometry Review

Visual review: disabled Pattern strings 1 and 2 are visually lighter; remaining controls and note map remain present. Notes stay visible while only pattern eligibility changes.

## Mobile check (390×844)

State: Overlays opened with pattern strings 1 and 2 excluded. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The first two pattern-string controls are visibly off while the note map remains displayed.
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 2 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `overlays-open` | [JSON](snapshots/geometry-overlays-open.json) | [PNG](screenshots/geometry-overlays-open.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `pattern-strings-1-2-hidden` | [JSON](snapshots/geometry-pattern-strings-1-2-hidden.json) | [PNG](screenshots/geometry-pattern-strings-1-2-hidden.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

