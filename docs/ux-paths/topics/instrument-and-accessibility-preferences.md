# Instrument and accessibility preferences

## STORY-801: Configure an all-fourths neck
**Type**: medium
**Topic**: Instrument and accessibility preferences
**Persona**: Guitarist using all-fourths tuning
**Goal**: Make the board match the instrument.
**Preconditions**: Default workspace.
**Ideal path**: 3 steps; open Settings, toggle all fourths, close.
**Alternate paths**: None found.
### Steps
1. Select **Settings**.
2. Enable **All fourths** → tuning description changes and the G–B warp guide is removed.
3. Close settings → the fretboard uses all-fourths note positions.
### Variations
- Select **Lowest string** for down-tuned instruments.
- Use **Frets** to shorten or extend the displayed neck.
### Edge Cases
- Turning all fourths back off restores the standard-tuning warp boundary.

## STORY-802: Mirror the board for a left-handed player
**Type**: short
**Topic**: Instrument and accessibility preferences
**Persona**: Left-handed guitarist
**Goal**: Put the nut on the right.
**Preconditions**: Any workspace.
**Ideal path**: 3 steps; open Settings, toggle Left-handed, close.
**Alternate paths**: None found.
### Steps
1. Open **Settings**.
2. Enable **Left-handed** → the board preview reverses its orientation.
3. Close settings → the header says “Nut right.”
### Variations
- Toggle **String names** to hide the string gutter.
- Left-handed works with Fit neck.
### Edge Cases
- Musical pitch identity stays unchanged when the display is mirrored.

## STORY-803: Use keyboard note navigation
**Type**: medium
**Topic**: Instrument and accessibility preferences
**Persona**: Keyboard-only learner
**Goal**: Inspect and mark a note without a pointer.
**Preconditions**: Fretboard is visible, not in an active drill.
**Ideal path**: 3 steps; focus a note, navigate, mark.
**Alternate paths**: Pointer hover/click can inspect and mark the same note.
### Steps
1. Focus a fretboard note → its identity is exposed in the inspector.
2. Use arrow keys → focus moves across adjacent board positions.
3. Press Enter → the note is marked and appears in Marked positions.
### Variations
- In a drill, note activation answers the prompt rather than marking.
- Hover also fills the inspector without changing marks.
### Edge Cases
- The inspector prompts “Select a note to inspect or mark it” before any selection.

## STORY-804: Reduce animation and silence playback
**Type**: short
**Topic**: Instrument and accessibility preferences
**Persona**: Sensory-sensitive learner
**Goal**: Study without animation or sound.
**Preconditions**: System reduced-motion preference enabled; app has sound on.
**Ideal path**: 3 steps; open Settings, disable Sound, close.
**Alternate paths**: The app honors reduced motion automatically; no in-app motion toggle exists.
### Steps
1. Open **Settings**.
2. Disable **Sound** → note clicks, form playback, and drill feedback become silent.
3. Close settings and study → transitions honor system reduced-motion preference.
### Variations
- Re-enable Sound later; this device preference persists.
- Dark mode can be toggled in the same dialog.
### Edge Cases
- If local storage is unavailable, the setting still works for the current session.

## STORY-805: Reset display preferences but retain study choices
**Type**: medium
**Topic**: Instrument and accessibility preferences
**Persona**: Explorer recovering from setup changes
**Goal**: Restore visual/instrument defaults without losing key, scale, or marks.
**Preconditions**: Several display settings and marks changed.
**Ideal path**: 3 steps; open Settings, reset view, close.
**Alternate paths**: Each Explore module offers a narrower **Restore defaults** action.
### Steps
1. Open **Settings**.
2. Select **Reset view** → display settings restore to defaults.
3. Close settings → key, scale, custom notes, and marked positions remain selected.
### Variations
- Instrument & display exposes its own restore when that section is changed.
- Overlays and Focus restore independently from their own panels.
### Edge Cases
- Reset does not clear practice progress, sound preference, or dark-mode preference.
