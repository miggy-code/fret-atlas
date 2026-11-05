# STORY-031: Isolate one rectangle shape

## Friction Scorecard

- **Measured steps:** 3/3 ideal. Selecting Shape exposed a Rectangle/Stack family toggle; Rectangle was selected by default and the board tag became `Form 2 · Rectangle`.
- **Decisions:** two meaningful decisions: switch study mode, then choose Rectangle or Stack. Defaulting Rectangle removes an unnecessary choice for the requested rectangle path.
- **Re-entry / confirmations / dead ends:** none observed.
- **Hesitation:** low. “Shape” is a broad label for a view that shows a single movable instance; the family toggle supplies the missing specificity after entry.
- **Verdict:** acceptable.

## Take-away Pass

- Do not remove Rectangle/Stack controls: they answer the immediate comparison task.
- Previous/Next arrows are necessary to cycle instances, but their relationship to the current form is indirect; the map tag carries that context.

## The Simpler Version

1. Choose Shape.
2. Confirm Rectangle (already selected by default).
3. Use Next or Previous to compare another instance.

The path meets the ideal count. Improve recognition by naming the arrows `Previous shape` / `Next shape` in this mode, or by placing a small “Shape 2 of …” label adjacent to them. This preserves the compact control layout while making the cycling target explicit.

## Clarity Issues

- `Previous form` and `Next form` remain the accessible labels in Shape mode, while the user is moving between individual rectangle instances. This is a terminology mismatch and a cross-mode naming drift.
- Evidence: live Shape state showed `Rectangle` selected and a `Form 2 · Rectangle` tag, with arrow labels still `Previous form` and `Next form`.
