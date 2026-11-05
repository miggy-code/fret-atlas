# STORY-021 — Find a prompted note and recover from a miss

## Friction Scorecard

| Measure | Evidence | Result |
|---|---|---|
| Steps | Practice → Find notes Start → tap targets | 3 / 3 ideal |
| Decisions | Pick the correct target from a hidden board; optional Hint, Reveal, Next, End | Necessary, except assistance actions compete slightly |
| Re-entry | None | 0 |
| Confirmations | None | 0 |
| Dead ends | End returns to the originating Start control | 0 |
| Hesitations | The three adjacent text actions, Hint, Reveal, and Next, have similarly quiet treatment during the first round | 1 suspected |

Live evidence: after Start, the drill sits directly above the fretboard (`.drill-bar`, 123–227 px), with the prompt “Find every G ♭7 on the E string” and feedback “Tap the fretboard. Notes stay hidden until you find them.” The board begins immediately below it at 265 px. Screenshot capture timed out in the preview environment, so this report uses live DOM/layout inspection rather than a saved image.

Verdict: **minimal**. The current three-step path matches the ideal and the prompt is now next to the board.

## Take-away Pass

- Keep the prompt, target pips, feedback, and End: each supports the active task.
- Keep Hint and Reveal as assisted learning aids, but visually group them under a secondary “Need help?” affordance so they do not compete with the active task.
- Keep Next as a recovery shortcut, but distinguish it from assistance. It advances the task rather than explaining it.

## The Simpler Version

1. Open Practice and choose Find notes.
2. Read the prompt directly above the board and tap targets.
3. Use a compact help menu only if stuck; finish or advance naturally.

Concrete change: combine **Hint** and **Reveal** under a labelled secondary help control, leaving **Next** and **End** as standalone task controls.

## Clarity Issues

- “Next” can mean skip the prompt or proceed after a reveal. Rename it to **Skip prompt** while the round is active, or make the label state-dependent.
