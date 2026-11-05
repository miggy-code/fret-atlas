# STORY-043: Start a drill with touch-sized controls

**Status:** pass

## Walk

At 390×844, opened Practice, started Find notes, then tapped the prompted target note on the fretboard. Correct response showed “All 1 in 0.1s”, score 1 and 1 round next to the prompt above the board.

## Visual and geometry review

Responsive viewport: 390×844. Screenshot inspection found no page-level horizontal overflow; string labels and the board remained available.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-practice-geometry.json
- step-2-drill-geometry.json
- step-3-feedback-geometry.json

## Flow log

Ideal 3 steps; completed in 3. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-practice.png](screenshots/step-1-practice.png)
- [step-2-drill.png](screenshots/step-2-drill.png)
- [step-3-feedback.png](screenshots/step-3-feedback.png)
- [mobile-check.png](screenshots/mobile-check.png)
