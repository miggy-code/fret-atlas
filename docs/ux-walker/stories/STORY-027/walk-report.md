# STORY-027: Finish a drill to earn credit

**Walk status:** pass (independently verified form-scoped recheck)
**Session:** isolated Playwright context; local and session storage cleared before the story.
**Viewports:** 1280×800 desktop and 390×844 mobile spot-check.

## Initial walk log (superseded: string-scoped prompt)

- Select Form 2, open Practice, and start Find notes.
- Prompt: “Find every D (4) on the e string.” Use the prompt and the form to identify both E-string target positions; the board reports “All 1” after completion.
- Choose End; the drill closes, but the Form 2 practice marker and key summary remain at 0 of 5.

## Visual and geometry audit

Viewed [screenshots/unassisted-completion-no-credit.png](screenshots/unassisted-completion-no-credit.png). The completion feedback is clear and the fretboard stays in context. The unexpected result is that successful unassisted completion does not update progress. The mobile screenshot shows the same prompt and board without page-level horizontal overflow.

## Initial finding (withdrawn after recheck)

An unassisted Find notes prompt can reach “All 1” and then End, while Practice still shows 0 of 5 forms practiced. This contradicts the story's expected Form 2 credit. See [findings.json](findings.json).

## Flow economy

Catalog ideal: 4 steps. The path completed in four user-facing steps, but the expected credit was not recorded. No real data was used.

## Recheck and correction

The initial completed prompt was scoped to the e string, so it was not eligible for Form 2 credit. The walker subsequently completed “Find every A (1) in Form 2”; `screenshots/prompt-completed.png` shows that completion. The walker reported that ending the drill then showed 1 of 5 forms practiced. The independent recheck below captured the final progress state.

## Independent browser recheck (1280×800)

In a fresh Playwright Chrome context with local and session storage cleared, I selected Form 2, started Find selected degrees, and completed the unassisted prompt “Find every A (1) in Form 2” by tapping both targets. The drill confirmed “All 2”; after End, the Practice progress panel showed “1 of 5 forms practiced in A minor” and marked Form 2 practiced. See [completed drill](recheck/form-2-drill-completed.png) and [post-End progress](recheck/form-2-progress-1-of-5.png).

The geometry audit was run at Form 2, drill-start, drill-completed and post-End progress states; each output and full DOM geometry snapshot is saved under [recheck](recheck/). All states reported 0 px page-level horizontal overflow. The drill states reported no overflow spills; the pre-drill and progress states report the board card extending 12 px beyond its visible box, matching the app's existing board sizing. Uneven sibling widths and compact form-number buttons are also reported by the heuristic audit.

## Geometry protocol (isolated Playwright, 1280×800)

Each listed state was recreated at `http://127.0.0.1:4177`; the repository `geometry-audit.js` ran in the page and its raw JSON and screenshot are linked below. Partial reproduction: The Form 2 prompt was recreated, but target completion and the resulting 1-of-5 credit were not recreated in this run. The report’s final credit claim remains not independently screenshot-verified.

- Form 2 Find notes prompt active: [`snapshots/reproduced-final-state-geometry.json`](snapshots/reproduced-final-state-geometry.json); [`screenshots/reproduced-final-state.png`](screenshots/reproduced-final-state.png). page overflow 0px; 3 geometric checks flagged.

Visual review of flagged geometry: the sampled screenshots for STORIES 019, 020, 021, 033, and 034 showed the short form controls and measured tooltip content remained visually contained; no material alignment or overflow defect was confirmed in those inspected screenshots. The audit flagged unequal widths for sibling controls with intentionally different labels or content.
