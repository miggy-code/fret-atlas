# STORY-039: Recover after storage becomes unavailable

**Status:** pass

## Walk

With Storage.setItem forced to throw in a fresh context, changed the key to C. Footer changed to “Storage unavailable · use Share view”. Share still worked and displayed the clipboard success toast.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-storage-error-geometry.json
- step-2-share-geometry.json

## Flow log

Ideal 2 steps; change state and Share. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-storage-error.png](screenshots/step-1-storage-error.png)
- [step-2-share.png](screenshots/step-2-share.png)

## Mobile check (390×844)

State: Forced Storage.setItem to fail in the isolated browser context, then changed the key to C; Storage unavailable feedback was present. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The C key is selected and the storage-unavailable message is shown in the mobile view.
