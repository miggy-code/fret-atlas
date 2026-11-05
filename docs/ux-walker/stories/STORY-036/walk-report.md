# STORY-036: Copy the current study view

**Status:** pass

## Walk

Prepared the Shape study view, clicked Share view, and observed the “View link copied” toast. STORY-038 then confirmed the copied link is a serialized atlas URL.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-share-geometry.json

## Flow log

Ideal 1 Share action; setup of customized precondition was excluded. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-share.png](screenshots/step-1-share.png)

## Mobile check (390×844)

State: Selected Shape and activated Share view; copied-link toast appeared. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The Shape control is selected and the copy confirmation is visible over the board.
