# Fret Atlas rebuild

The user approved staged implementation on 2026-09-13. Stop at the first
visual checkpoint before broadening the remaining viewing modes. Full parity
is the destination, not the claim for this first milestone.

1. Reference specification and independent musical fixtures.
2. React / TypeScript / one-coordinate SVG renderer. Pentatonic and blues
   rectangle/stack slice, legible with and without labels. Visual checkpoint.
3. Full scale catalog, instruments, tunings, and orthogonal controls.
4. In-position, diagonal, two-string, one-string, and 3NPS modes.
5. Cross-mode integration, browser, accessibility, and visual polish.
6. Final unification and removal of the preserved legacy implementation.

## First checkpoint acceptance

- One shared geometry for strings, notes, fret numbers and shape outlines.
- All keys, rectangle/stack, including the G–B boundary and open strings.
- Scale degrees are explicit data, not generic semitone names.
- Root, skeleton, added tone, shape membership and marks stay distinguishable.
- Whole map and label choice do not change the selected shape.
- No low-opacity note text. Physical inlays distinct from musical markers.
- Keyboard, touch, mirror, scrolling, reload and saved-state migration checked.
- Reference-observed cases are separate from inferred behavior.

## Boundaries

Reference: https://fretscience.com/tools/scale-visualizer

Some reference scales and three viewing modes are access-restricted. Do not
bypass restrictions or present unverified behavior as matching the reference.
Keep existing custom notes, triads, marks and focus functionality available.
Keep the rebuild local for the first review. Do not publish an incomplete
milestone as the completed parity project.
