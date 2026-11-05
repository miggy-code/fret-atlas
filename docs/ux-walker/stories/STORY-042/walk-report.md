# STORY-042: Scroll a non-fitted long neck

**Status:** pass

## Walk

At 390×844, selected Diagonal and 24 frets, then scrolled the fretboard shell to the end. The board reached frets 20–24 while the page controls stayed in place. Geometry reported pageOverflowX=0.

## Visual and geometry review

Responsive viewport: 390×844. Screenshot inspection found no page-level horizontal overflow; string labels and the board remained available.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-long-neck-geometry.json
- step-2-scrolled-geometry.json

## Flow log

Ideal 1 scroll action after the stated long-neck precondition. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-long-neck.png](screenshots/step-1-long-neck.png)
- [step-2-scrolled.png](screenshots/step-2-scrolled.png)
- [mobile-check.png](screenshots/mobile-check.png)
