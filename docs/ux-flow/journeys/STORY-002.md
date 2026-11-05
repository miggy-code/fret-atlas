# STORY-002: Move between pentatonic forms

## Friction Scorecard

- **Measured steps:** 3/3 ideal. Form buttons are explicitly named `Form 1` through `Form 5`; choosing Form 2 updated both the selected state and the map tag, from `Form 1` to `Form 2`.
- **Decisions:** one meaningful decision, which form to study. The direct picker avoids the slower arrow-only route.
- **Re-entry / confirmations / dead ends:** none observed.
- **Hesitation:** low. The picker numbers lack visible text labels in the control itself, though their accessible names provide context and the form tag confirms the selection.
- **Verdict:** acceptable.

## Take-away Pass

- Keep direct Form 1–5 choices and the previous/next arrows: the former supports jumping, the latter supports sequence practice.
- The current `Frets 7–10` readout is useful confirmation and should remain next to the picker.

## The Simpler Version

1. Pick Form 2 from the labelled 1–5 control.
2. Read the changed fret range and inspect the board.
3. Pick Form 1 to return.

The interaction already meets the ideal step count. A small clarity improvement would make the visible buttons read `Form 1`–`Form 5` on first use, or add a persistent nearby label such as “Choose form,” so sighted beginners do not have to infer what bare numbers mean.

## Clarity Issues

- The live DOM exposes excellent accessible names (`Form 1` … `Form 5`), but visible buttons are bare numerals. This creates a recognition gap for a first-time learner.
- Evidence: Form 2 selection changed `aria-pressed` to `true`, `Frets 5–8` to `Frets 7–10`, and the map tag to `Form 2`.
