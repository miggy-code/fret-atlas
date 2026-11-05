# STORY-040: Resume the saved workspace

**Status:** pass

## Walk

Changed the key to C and selected Form 3. After reload, C and Form 3 remained selected; verified Form 3 aria-pressed=true and the saved workspace state.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-resumed-geometry.json

## Flow log

Ideal 1 reopen action; state reappeared without re-entry. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-resumed.png](screenshots/step-1-resumed.png)

## Mobile check (390×844)

State: Selected key C and Form 3, then reloaded the isolated browser page. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The C / Form 3 workspace is shown after reload; study controls remain stacked above the board.
