# STORY-018 — Build and hear a chord over a scale

## Friction Scorecard

| Measure | Evidence | Result |
|---|---|---|
| Steps | Screenshot `critique-chord.png`: select C, select major, then press **Show tones** | 3 / 3 ideal; 4 if auditioning |
| Decisions | Root and quality are essential; whether to show or hear is a valid separate intent | 3 necessary decisions |
| Re-entry | None; the selected chord is carried into Practice | 0 |
| Confirmations | None | 0 |
| Dead ends | The board legend identifies **C major triad** and **Hide tones** reverses it | 0 |
| Hesitations | **Hear chord** is visible before tones are shown, so it is less clear whether it auditions the chosen but hidden chord or the overlay | 1 |

Measured live evidence: `critique-chord.png` shows C major controls, the active **Hide tones** state, green board rings, and the matching legend. The chord row states “in A Minor pentatonic,” which makes the outside-scale comparison explicit.

Verdict: **minimal**. The visible path matches the ideal and preserves user control; no screen merge or default would improve it.

## Take-away Pass

- Keep root, quality, Show/Hide, and Hear: each is used by the task and has a distinct result.
- The sentence “in A Minor pentatonic” earns its space because the whole value of the flow is comparison against the active scale.
- The board legend is a necessary confirmation of the overlay’s visual meaning.
- Do not combine **Show tones** and **Hear chord**: learners often need to see a chord without sound or audition it again.

## The Simpler Version

1. Choose a root and quality in the always-visible Chord row.
2. Show its tones on the board.
3. Hear it when desired.

No structural change is warranted. The existing arrangement is the smallest clear flow. If polishing, style **Show tones** as the chord row’s primary action only while tones are hidden; its active state is already visibly conveyed as **Hide tones**.

## Clarity Issues

- The same root and quality controls occur in Explore and Practice. This is intentional shared state, not duplicate implementation, but Practice should explicitly say it uses the chord selected in Explore.
- **Hear chord** is clear after tones are visible; before that, an accessible description such as “Play selected chord” would make the control’s object unambiguous.
