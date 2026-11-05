# Whole-neck and linear scale views

## STORY-UNASSIGNED: Survey every pattern on the neck

**Type**: medium
**Topic**: Whole-neck and linear scale views
**Persona**: Intermediate guitarist mapping the full fretboard
**Goal**: View all partial and complete rectangle/stack patterns.
**Preconditions**: Named pentatonic scale.
**Ideal path**: 3 steps — choose Whole neck, filter a family, inspect a note.
**Alternate paths**: Position plus Connect positions gives a narrower neighboring-form comparison.

### Steps
1. Select Whole neck → every rectangle and stack, including edge partials, appears.
2. Select Rectangles, Stacks, or Both → the pattern family filter changes the overlay.
3. Hover a note → its constituent shapes are highlighted and identified.

### Variations
- Change neck length to compare 12- and 24-fret coverage.

### Edge Cases
- A fit control appears where a long whole-neck view would overflow the viewport.

## STORY-UNASSIGNED: Fit the long neck to a narrow screen

**Type**: short
**Topic**: Whole-neck and linear scale views
**Persona**: Mobile learner
**Goal**: Make a long Whole neck map readable without horizontal board scrolling.
**Preconditions**: Whole neck or Diagonal view at a long fret count on a narrow viewport.
**Ideal path**: 1 step — enable Fit neck to screen.
**Alternate paths**: Leave fit off and horizontally scroll only the fretboard.

### Steps
1. Tap Fit neck to screen → the board scales to the available width and the control indicates it is on.

### Variations
- Toggle it off to return to full-scale, scrollable fret spacing.

### Edge Cases
- The control is not surfaced on desktop for a neck short enough to fit naturally.

## STORY-UNASSIGNED: Study the scale on one string

**Type**: medium
**Topic**: Whole-neck and linear scale views
**Persona**: Guitarist practicing note locations linearly
**Goal**: See a scale’s notes along one string and inspect positions.
**Preconditions**: Any scale with selected pitches.
**Ideal path**: 3 steps — choose One string, choose context if desired, inspect notes.
**Alternate paths**: Whole neck shows the same pitch classes across every string.

### Steps
1. Select One string in Study view → the board presents the linear scale view.
2. Optionally open Overlays and toggle Notes outside the scale → nearby non-scale context can appear.
3. Hover/focus notes → inspect names, degrees, and string/fret locations.

### Variations
- Change key or scale to compare intervals on the same string.

### Edge Cases
- One string is disabled only when no pitches are selected, such as an empty custom set.

## STORY-UNASSIGNED: Use a seven-note scale in 3 notes/string view

**Type**: medium
**Topic**: Whole-neck and linear scale views
**Persona**: Player practicing three-notes-per-string patterns
**Goal**: Switch from pentatonic geometry to a seven-note linear fingering layout.
**Preconditions**: A seven-note named scale is available.
**Ideal path**: 3 steps — select a seven-note scale, choose 3 notes/string, inspect the result.
**Alternate paths**: One string remains available for any non-empty scale and offers a simpler linear view.

### Steps
1. Select a seven-note scale from Scale → the prerequisite is satisfied.
2. Select 3 notes/string → the corresponding study view becomes active.
3. Inspect notes along strings → confirm the interval labels or names for the fingering pattern.

### Variations
- Change Note view to Intervals to prioritize scale-function reading.

### Edge Cases
- With fewer than seven selected pitches, 3 notes/string is disabled and says it requires a seven-note scale.

## STORY-UNASSIGNED: Compare a complete map with a focused range

**Type**: medium
**Topic**: Whole-neck and linear scale views
**Persona**: Learner working a small high-neck region
**Goal**: Use Whole neck for context, then constrain the working range.
**Preconditions**: Whole neck selected.
**Ideal path**: 4 steps — view whole neck, open Focus, set range, remove focus.
**Alternate paths**: Selecting a Position form provides a predefined localized area.

### Steps
1. Select Whole neck → the full map establishes context.
2. Open Focus → fret and string constraints are available.
3. Enable Fret range and set a limited region → the board shows the working area.
4. Disable Fret range or Restore defaults in Focus → the full map returns.

### Variations
- Exclude strings to narrow the exercise further.

### Edge Cases
- Focus changes drill eligibility; an over-constrained practice drill presents a recovery message.
