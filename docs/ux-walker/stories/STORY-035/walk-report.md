# STORY-035: Hear the active form

**Status:** pass

## Walk

Clicked Play in Explore; playback visibly began, changing the active note state. Stop appeared and was clicked; normal board returned. Audio was not independently audible in headless Chromium, so only playback UI and note animation were verified.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-playing-geometry.json
- step-2-stopped-geometry.json

## Flow log

Ideal 2 steps; achieved in 2. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-playing.png](screenshots/step-1-playing.png)
- [step-2-stopped.png](screenshots/step-2-stopped.png)

## Mobile check (390×844)

State: Started playback from the Explore view. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: Playback is active in the captured mobile state; the board and transport control remain visible.
