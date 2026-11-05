# STORY-044: Change forms without losing the board

**Status:** pass

## Walk

At 390×844, tapped Form 3. It became selected (aria-pressed=true) and the board updated to that form.

## Visual and geometry review

Responsive viewport: 390×844. Screenshot inspection found no page-level horizontal overflow; string labels and the board remained available.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-form-3-geometry.json

## Flow log

Ideal 1 action; completed in 1. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-form-3.png](screenshots/step-1-form-3.png)
- [mobile-check.png](screenshots/mobile-check.png)
