# STORY-038: Open a shared view without overwriting device preferences

**Status:** pass

## Walk

Set key C, Major · Ionian, Whole neck and Sound off; copied a 973-character atlas URL and opened it. The shared map loaded with C Major · Ionian and Whole neck. Practice showed local progress (0 of 5 forms in C major); Settings still showed Sound off.

## Visual and geometry review

Responsive spot-check: primary desktop viewport 1280×800.
Screenshots were opened and inspected. Board, control alignment, labels, and content containment remained usable in the captured states. Geometry audit output is recorded per captured state; mobile pageOverflowX was 0 where reported. Button label wrapping at mobile width is recorded in finding F-STORY-041-001 and also visible on this story’s mobile-check screenshot when present.

- step-1-loaded-geometry.json
- step-2-practice-geometry.json
- step-3-settings-geometry.json

## Flow log

One shared-link open after fixture preparation; no extra user detours. No extra navigation or repeated data entry was needed.

## Evidence

- [step-1-loaded.png](screenshots/step-1-loaded.png)
- [step-2-practice.png](screenshots/step-2-practice.png)
- [step-3-settings.png](screenshots/step-3-settings.png)

## Mobile check (390×844)

State: Set C Major · Ionian and Whole neck in the UI, disabled Sound in Settings, generated a share URL, then opened that URL in the same isolated browser context. Screenshot: [mobile-check.png](screenshots/mobile-check.png). Visual inspection: The shared C Major · Ionian view loaded with Whole neck selected; the map remains horizontally scrollable.
