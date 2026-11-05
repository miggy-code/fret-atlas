# Focused workspace configuration

## STORY-TBD: Narrow practice to a fret range and strings

**Type**: medium
**Topic**: Focused workspace configuration
**Persona**: Deliberate practicer
**Goal**: Restrict the visual map and drills to frets 5–9 on the top three strings.
**Preconditions**: Explore is active with a named scale.
**Ideal path**: 4 steps. Open Focus, enable its range, set bounds, select strings.
**Alternate paths**: The range accepts numeric input; strings can be toggled individually in either order.

### Steps
1. Open **Focus**.
2. Enable **Fret range**.
3. Set From fret to 5 and To fret to 9.
4. Toggle strings 4, 5, and 6 off → only strings 1–3 and frets 5–9 remain in focus.

### Variations
- Start a Practice drill; its eligible targets use the focused range and strings.
- Restore defaults for Focus to restore its full visible range and string set.

### Edge Cases
- The input bounds keep From at or below To and within the selected neck length.

## STORY-TBD: Reduce visual context around a position

**Type**: medium
**Topic**: Focused workspace configuration
**Persona**: New guitarist
**Goal**: Make one position less visually busy while retaining a root-note guide.
**Preconditions**: A Position view with a pentatonic family is open in Explore.
**Ideal path**: 3 steps. Open Overlays, enable Skeleton, hide surrounding context.
**Alternate paths**: Pattern-family filtering above the board can reduce outlines without opening Overlays.

### Steps
1. Open **Overlays**.
2. Enable **Skeleton** → root notes are connected across the neck.
3. Turn off **Notes outside the scale** and leave **Whole map** off → unrelated context does not compete with the active form.

### Variations
- Enable Whole map to compare the active form with quieter remaining scale notes.
- Enable Pentatonic only on a scale with added tones.

### Edge Cases
- Whole map is unavailable in Whole neck because that view already displays the complete map.

## STORY-TBD: Hide pattern outlines on excluded strings

**Type**: short
**Topic**: Focused workspace configuration
**Persona**: Advanced explorer
**Goal**: Compare a shape only on its lower four strings without hiding note labels.
**Preconditions**: A pentatonic scale is selected and Overlays is open.
**Ideal path**: 2 steps. Exclude the unwanted pattern strings; inspect the remaining outline.
**Alternate paths**: Use Focus strings to remove all note interaction from strings, rather than only pattern outlines.

### Steps
1. In Pattern strings, toggle strings 1 and 2 off.
2. Read the board → patterns requiring those strings are hidden while their notes remain visible.

### Variations
- Re-enable the strings to restore the related pattern overlays.

### Edge Cases
- If the exclusions eliminate every eligible pattern, the board reports that notes remain visible even though no pattern fits.

## STORY-TBD: Restore only a changed configuration panel

**Type**: short
**Topic**: Focused workspace configuration
**Persona**: Cautious returning learner
**Goal**: Undo experimental overlays without losing key, scale, marks, or other workspace settings.
**Preconditions**: Overlays differ from their defaults.
**Ideal path**: 2 steps. Recognize Changed and restore that module.
**Alternate paths**: Settings offers Reset view for all display settings; it retains key, scale, custom notes, and marks.

### Steps
1. Open **Overlays** and see its Changed state.
2. Choose **Restore defaults** → only overlay controls reset.

### Variations
- Use the same pattern for Focus or Note view.

### Edge Cases
- If a study-specific control is unavailable, its restore action still resets the saved section state.

## STORY-TBD: Return to a saved workspace

**Type**: medium
**Topic**: Focused workspace configuration
**Persona**: Returning learner
**Goal**: Resume a configured study session after a page reload.
**Preconditions**: The learner has changed focus, overlays, labels, or marked notes; browser storage is available.
**Ideal path**: 2 steps. Make a configuration and reload.
**Alternate paths**: A share URL restores the serialized workspace on another browser/device.

### Steps
1. Configure a focus or overlay and mark a note.
2. Reload the page → the board restores the saved workspace state.

### Variations
- Change the study form; a form that needs more frets can expand the neck automatically.

### Edge Cases
- If local storage is unavailable, the app stays usable and presents Share view as the recovery path.
