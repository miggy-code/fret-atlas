# STORY-047: Fit the long neck to a narrow screen

**Status:** pass

## Walk

At 390×844, selected Whole neck with 24 frets and tapped Fit neck to screen. The full neck compressed into the viewport; all string labels remained visible. Geometry reported pageOverflowX=0.

## Visual and geometry review

Responsive viewport: 390×844. Screenshot inspection found no page-level horizontal overflow; string labels and the board remained available.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-long-geometry.json
- step-2-fit-geometry.json

## Flow log

One fit action after the stated long-neck precondition. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-long.png](screenshots/step-1-long.png)
- [step-2-fit.png](screenshots/step-2-fit.png)
- [mobile-check.png](screenshots/mobile-check.png)
