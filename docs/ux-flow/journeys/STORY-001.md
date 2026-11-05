# STORY-001: Identify the default position

## Friction Scorecard

- **Measured steps:** 2/2 ideal. The initial workspace identifies `A` and `Minor pentatonic`; Position is selected and Form 1 is tagged.
- **Decisions:** none before value. Key and Scale controls are available but do not block the initial map.
- **Re-entry / confirmations / dead ends:** none observed.
- **Hesitation:** low. The board itself starts 98 px after the primary study controls, but the immediate study state is still visible without scrolling on a 1280 px desktop viewport.
- **Verdict:** minimal.

## Take-away Pass

- The header tuning sentence is helpful context but secondary to the key/scale identity.
- The full Key and Scale selectors precede the first board. They are required for exploration but visually compete with the new-user task of understanding the default map; defer them after first board exposure only if a future onboarding pass finds first-time users changing them accidentally.

## The Simpler Version

1. Arrive with the key, scale, Position, Form 1, and neck visibly identified.
2. Hover or focus a note and read its identity in the inspector.

No structural change is warranted: the observed entry path already matches the ideal two steps.

## Clarity Issues

- **Suspected, needs visual interaction confirmation:** the inspector copy says “Select a note to inspect or mark it,” while the story describes hover or focus. Align the wording with the supported interaction if hover is intended as a first-class method.
- Evidence: initial live DOM at `http://127.0.0.1:4177/`; board header exposed `A`, `Minor pentatonic`, `Position`, and `Form 1`.
