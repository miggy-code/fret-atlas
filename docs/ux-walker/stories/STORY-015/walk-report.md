# STORY-015 — Reset display preferences but retain study choices

**Status:** fail. Isolated Chrome context; desktop 1280×800.

1. Marked A4, opened Settings, and changed Left-handed and All fourths. Screenshot: screenshots/step-1.png.
2. Selected Reset view; screenshot: screenshots/step-2.png.
3. Closed Settings; key value=9, scale=minor-pentatonic, the marked fret position remained visible (its note identity shifted with tuning). Screenshot: screenshots/step-3.png.

Key and scale remained, and the marked location remained selected. Left-handed reset to Nut left, but All fourths stayed enabled after Reset view. This matches the test expectation called out by the coordinator; the catalog wording conflicts, so F-STORY-015-1 records a documentation scope mismatch rather than a product behavior defect.

## Flow Log

Completed in the ideal 3 steps; no detours.

## Visual / Geometry Review

Visual review: Left-handed reset to Nut left, but All fourths stayed enabled after Reset view. This matches the test expectation called out by the coordinator; the catalog wording conflicts, so F-STORY-015-1 records a documentation scope mismatch rather than a product behavior defect. The marked fret position remains outlined.

## Triage and change

Tuning preservation is intentional and covered by `tests/catalog.test.ts`. The Settings reset description and README were updated to state that tuning stays; the original screenshot records the behavior before the copy change. The copy change was subsequently re-walked as documented below.

## Mobile check (390×844)

State: Marked A4, changed Left-handed and All fourths, then used Reset view. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The resulting Settings panel is visible at mobile width. All fourths remains enabled, matching the prior reported reset behavior.

## Independent browser recheck (1280×800)

Using isolated Playwright Chrome with cleared local and session storage, I opened Settings and verified the updated copy: “Restore display settings to their defaults. Tuning, key, scale and marked notes stay.” I changed Lowest string to F♯, enabled All fourths and Left-handed, then chose Reset view. The board returned to Nut left while retaining F♯ lowest and All fourths; the header read “All fourths · High strings above · Nut left.” Screenshots: [settings-copy.png](recheck/settings-copy.png) and [post-reset.png](recheck/post-reset.png).

Geometry was audited before reset, after reset with Settings closed, and after reopening Settings to verify retained tuning. All three reports show 0 px horizontal page overflow and no overflow spills. Reopened Settings showed Lowest string F♯, All fourths checked, and Left-handed unchecked. The auditor flags the same unequal-width header/musical-control groups and compact 1–5 form buttons as wrapped controls. See [post-reset Settings](recheck/post-reset-settings.png); geometry snapshots and audit output are in [recheck](recheck/).
## Geometry audit — isolated desktop reproduction

Reproduced the documented desktop states in isolated Chromium contexts at 1280×800 and ran the actual `geometry-audit.js` in each state. All 3 captures measured `pageOverflowX=0`. Screenshots were visually reviewed alongside the JSON.

| State | Audit JSON | Screenshot | Result |
|---|---|---|---|
| `modified-settings` | [JSON](snapshots/geometry-modified-settings.json) | [PNG](screenshots/geometry-modified-settings.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `reset-view` | [JSON](snapshots/geometry-reset-view.json) | [PNG](screenshots/geometry-reset-view.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |
| `settings-closed` | [JSON](snapshots/geometry-settings-closed.json) | [PNG](screenshots/geometry-settings-closed.png) | 6 uneven-row heuristic flags; 5 wrapped-control heuristic flags |

Visual triage: the repeated uneven-row flags are unequal widths among text-sized controls (for example header actions, key/scale fields, legend items, and scale-tone chips); screenshot review shows intentional sizing with aligned baselines. The five wrapped-control flags are the single-digit Form 1–5 buttons, whose button height/padding trips the script heuristic although each label occupies one line. The note-hover spill flags are SVG tooltip text exceeding its own text-node box; the tooltip itself is visibly contained and legible. STORY-010’s 5px board-card spill heuristic is not visibly escaping the card. No geometry flag was confirmed as a meaningful layout defect, so no additional finding was added.

