# UX Flow Critique — 2026-11-05

## Run summary

Eight core journeys were reviewed against the local application and the journey catalog: three minimal, five acceptable, none convoluted. Reviews covered entry, form and shape navigation, focus, chord exploration, drills, and progress. Practice reviewers reported screenshot timeouts; their findings rely on live DOM and layout observations rather than saved screenshots. Other screenshots are in `journeys/`.

## Friction and proposals

| Journey | Verdict | Finding |
|---|---|---|
| [Default position](journeys/STORY-001.md) | Minimal | Useful map is available immediately. |
| [Move between forms](journeys/STORY-002.md) | Acceptable | Numbered choices need clearer context for beginners. |
| [Focus practice](journeys/STORY-006.md) | Acceptable | Focus and pattern-string controls have different effects that need clearer wording. |
| [Explore a chord](journeys/STORY-018.md) | Minimal | Existing path is direct. |
| [Find a note](journeys/STORY-021.md) | Minimal | Drill prompt and board sit together. |
| [Practice degrees](journeys/STORY-022.md) | Acceptable | Repeated Start labels and assistance credit need clarification. |
| [Choose a key from progress](journeys/STORY-028.md) | Acceptable | Clarify that the progress grid also selects a key. |
| [Isolate a shape](journeys/STORY-031.md) | Acceptable | Navigation arrows should name the item they navigate. |

## Ranked changes

1. Give drill buttons distinct action labels and explain that assisted rounds do not earn form credit. Improves recognition and feedback across practice journeys; no steps added.
2. Clarify that Focus limits notes and drills, and explain the progress grid as a key chooser. Keeps useful controls in place while distinguishing their purposes.
3. Name shape and diagonal navigation according to the active study view. This fixes accessible naming drift without changing navigation.
4. Consider top/bottom string presets only after confirming demand; current individual toggles support arbitrary selections, and presets add controls.

## Redundancy

[Cross-journey audit](redundancy.md) found no harmful duplicate paths or duplicated facts. Three pairs of shortcuts and three contextual repetitions serve distinct needs. One potential overlap is the wording of Focus strings versus Pattern strings; the latter already explains that notes remain visible.

## Already minimal

The default view, chord exploration, and basic note drill reached their goals directly. Keep the direct form picker alongside sequential arrows and the key selector alongside the progress grid: each serves a different context.

## Scope and follow-up

The catalog is code-derived, not a substitute for observed user research. The review covered eight journeys, not the full 50-story walker run. No GitHub issues were filed: the workspace rules require Miguel's approval before external actions.
