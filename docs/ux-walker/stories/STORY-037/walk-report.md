# STORY-037: Recover from clipboard denial

**Status:** pass

## Walk

Injected a clipboard write rejection in an isolated context, clicked Share view, and observed “Select and copy your view link” plus the manual View link field. Focused the field.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-denied-geometry.json
- step-2-field-geometry.json

## Flow log

Ideal 2 steps; share and focus completed. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-denied.png](screenshots/step-1-denied.png)
- [step-2-field.png](screenshots/step-2-field.png)

## Mobile check (390×844)

State: Forced clipboard write denial in the isolated browser context and activated Share view; fallback text “Select and copy your view link” appeared. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The manual copy fallback is visible at mobile width; the primary Share control remains reachable.
