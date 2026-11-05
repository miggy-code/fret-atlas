# Redundancy and information architecture critique

## Duplicate Paths

- **Move between forms:** direct Form 1–5 choices and previous/next arrows are a deliberate direct-selection plus sequential-navigation pair. Keep both. Evidence: catalog redundancy candidates and the form bar in `critique-config-overview.png`.
- **Restore configuration:** module **Restore defaults** and Settings **Reset view** serve distinct scopes. Keep both and retain their scope labels. Evidence: Focus’s scoped reset in `critique-focus-configured.png`; Settings’s reset description in the catalog.
- **Clear degree isolation:** re-clicking a degree and **Show all degrees** are a shortcut plus explicit recovery pair. Keep both; the explicit command remains the canonical multiple-selection recovery.

Count: 0 harmful duplicate paths; 3 intentional shortcut pairs.

## Duplicate Information

- Key, scale, and form appear in the header, controls, and Practice context. Each surface answers a different orientation question, so no removal is recommended. The exact terms must remain identical.
- Chord root and quality appear in Explore and Practice because Practice consumes the Explore selection. Evidence: `critique-chord.png` and catalog STORY-023. Preserve the shared state, then explain it in Practice copy.
- Note identity in a transient hover state and persistent inspector supports distinct mouse and keyboard use. Keep both.

Count: 0 harmful duplicated facts; 3 intentional contextual repetitions.

## Overlapping Features

- **Focus strings** limits visible notes and practice targets. **Pattern strings** only hides pattern outlines that touch excluded strings. Both are valid, but their similar labels invite an incorrect mental model. Evidence: Focus panel in `critique-focus-configured.png`, GuideDialog copy, and catalog redundancy candidates. Recommend renaming the Focus summary to **Limit notes and drills by fret and string** and adding one-line help under Pattern strings.
- Shape family filters and Shape study are adjacent rather than overlapping: one compares families; the other isolates one shape. Keep both.
- Fit neck and horizontal scrolling are complementary overview/detail choices. Keep both.

Count: 1 naming-risk overlap; 2 complementary pairs.

## Hierarchy & IA

- The shared board and study controls precede Explore/Practice-specific controls, which matches the user’s primary object of attention.
- Focus is appropriately disclosed below the board, but its summary understates its consequence for practice. Promote that consequence in its summary rather than moving the module.
- The Chord row is visible near the board and works as a lightweight compare-and-listen tool. Its placement is appropriate; it should not be folded into Overlays.

Count: 1 hierarchy/copy improvement; no structural navigation issue observed.
