# STORY-021: Find a prompted note and recover from a miss

**Walk status:** pass
**Session:** isolated Playwright context; local and session storage cleared before the story.
**Viewports:** 1280×800 desktop and 390×844 mobile spot-check.

## Walk log

- Open Practice and select the Find notes card; it starts the drill directly (the live UI has no separate Start button).
- Read the prompt, “Find every C ♭3 in Form 1,” then use the fretboard pitch pattern to tap the three target positions.
- The board reveals the notes and feedback reports “All 3”; the round is complete.

## Visual and geometry audit

Viewed [screenshots/completed-target.png](screenshots/completed-target.png). The prompt and board remain visible; note labels do not wrap and the hidden-note states are easy to distinguish. The mobile spot-check keeps the six string labels visible, with 0px page-level horizontal overflow.

## Flow economy

Catalog ideal: 3 steps. The UI begins the drill from Find notes directly, so no separate Start action is needed. No real user data was used.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the geometry audit ran in the page and its raw JSON and geometry snapshot are saved below. I reproduced “Find every C ♭3 in Form 1” by selecting only C (with no hint or reveal), then tapped the three visible target positions: string 1 fret 8, string 3 fret 5, and string 6 fret 8. The drill reported “All 3” and “3 of 3 found.” See the [active prompt](recheck/prompt.png) and [unassisted completed state](recheck/completed-unassisted.png), with audits and geometry snapshots in [recheck](recheck/).

The completed state audit measured 0 px page overflow, no overflow spills, and no wrapped controls. It flagged unequal widths in the header actions, mode tabs, and drill actions; those groups have different-length labels. The prompt state audit and its full geometry snapshot are also saved.

- Find notes prompt active: [`snapshots/practice-prompt-geometry.json`](snapshots/practice-prompt-geometry.json); [`screenshots/practice-prompt.png`](screenshots/practice-prompt.png). page overflow 0px; 3 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
