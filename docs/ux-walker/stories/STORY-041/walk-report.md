# STORY-041: Fit a diagonal map on a phone

**Status:** pass

## Walk

At 390×844, selected Diagonal and Fit neck to screen. Board scaled to show the full pattern and string labels. Geometry reported pageOverflowX=0.

## Visual and geometry review

Responsive viewport: 390×844. Screenshot inspection found no page-level horizontal overflow; string labels and the board remained available.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-diagonal-geometry.json
- step-2-fitted-geometry.json

## Flow log

Ideal 2 steps; completed in 2. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-diagonal.png](screenshots/step-1-diagonal.png)
- [step-2-fitted.png](screenshots/step-2-fitted.png)
- [mobile-check.png](screenshots/mobile-check.png)

## Fix verification

The Note view and Colors groups use two columns at widths up to 480px. The responsive browser test verifies Lucky Charms, Root highlight, Scale degrees, and Chord tones fit on one line at 320px and 390px without escaping their buttons. The original screenshots above show the pre-fix layout.
