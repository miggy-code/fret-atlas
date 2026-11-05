# Note and chord exploration

## STORY-TBD: Read scale degrees on the map

**Type**: short
**Topic**: Note and chord exploration
**Persona**: New guitarist
**Goal**: Understand what each note in the default A minor pentatonic position represents.
**Preconditions**: Default Position view is open in Explore.
**Ideal path**: 2 steps. Pick an explanatory note presentation, then inspect a note.
**Alternate paths**: A note can be inspected by pointer hover/focus, or marked by click/Enter for later review.

### Steps
1. Select **Intervals** under Note view → every active note displays its scale interval.
2. Hover or focus a fretboard note → the inspector announces its name, degree, string, and fret.

### Variations
- Choose **Both** to see note names alongside intervals.
- Choose **Scale degrees** under Colors for a color-coded reading of the same relation.

### Edge Cases
- Choosing Lucky Charms replaces the note view and hides the separate color picker.

## STORY-TBD: Isolate a scale degree, then restore the full scale

**Type**: medium
**Topic**: Note and chord exploration
**Persona**: Deliberate practicer
**Goal**: See only the flat third across the current map before returning to the complete scale.
**Preconditions**: A named scale is selected in Explore.
**Ideal path**: 2 steps. Select a degree and clear the isolation.
**Alternate paths**: Re-click the selected degree to clear it, or use **Show all degrees** after any degree is isolated.

### Steps
1. In Scale degrees, click the chip labelled **C ♭3** in A minor → that degree remains prominent and other degrees dim.
2. Click **Show all degrees** → the complete active scale returns.

### Variations
- Select several chips to compare a subset of degrees.
- Switch the key or scale; the selected interval relationship persists in the newly derived map.

### Edge Cases
- Custom notes use the same strip to add/remove pitches; they do not provide degree isolation.

## STORY-TBD: Build and hear a chord over a scale

**Type**: medium
**Topic**: Note and chord exploration
**Persona**: Curious intermediate guitarist
**Goal**: Compare C major chord tones against A minor pentatonic.
**Preconditions**: Explore is active; sound may be on or off.
**Ideal path**: 3 steps. Choose root, choose quality, show/hear tones.
**Alternate paths**: The same chord root and quality controls appear in Practice for a chord-tone drill.

### Steps
1. Set Chord root to **C**.
2. Set chord quality to **major**.
3. Choose **Show tones**, then **Hear chord** → C, E, and G are shown on the fretboard and auditioned.

### Variations
- Select a chord containing tones outside the scale; the chord overlay still shows all three tones.
- Select **Hide tones** while retaining the next chosen chord settings.

### Edge Cases
- With sound disabled, Hear chord leaves the map intact and reports that sound can be turned on in Settings.

## STORY-TBD: Turn a named scale into a custom note set

**Type**: medium
**Topic**: Note and chord exploration
**Persona**: Advanced explorer
**Goal**: Start from a familiar scale, modify its notes, and study the resulting pitch set.
**Preconditions**: A named scale is selected in Explore.
**Ideal path**: 3 steps. Enter Customize notes, change pitches, choose an eligible study view.
**Alternate paths**: Select the Custom scale in the main Scale picker, then use All, Naturals, or Clear as starting sets.

### Steps
1. Click **Customize notes** beneath Scale tones → the scale becomes Custom.
2. Toggle note chips to include or remove pitches.
3. Choose **Whole neck** or **One string** to study the resulting set.

### Variations
- Click **All**, **Naturals**, or **Clear** to reset the custom pitch set quickly.
- Restore the Note view section without changing the custom pitches.

### Edge Cases
- Position, Shape, and Diagonal are unavailable for a custom pitch set because they require a pentatonic family.

## STORY-TBD: Mark notes to compare later

**Type**: short
**Topic**: Note and chord exploration
**Persona**: Returning learner
**Goal**: Save two fretboard locations to revisit while experimenting with labels.
**Preconditions**: Explore is active and no drill is running.
**Ideal path**: 3 steps. Mark two notes, inspect the resulting list, remove one if it was wrong.
**Alternate paths**: Click notes with a pointer or focus them and press Enter.

### Steps
1. Click a fretboard note → it is marked and appears in Marked positions.
2. Click a second note → it joins the saved list.
3. Click a listed mark to remove it, or choose **Clear marks** to remove all.

### Variations
- Mark a position outside the currently visible fret range; the list identifies it as off screen.

### Edge Cases
- Marking is unavailable while a drill is active because board taps answer the drill instead.
