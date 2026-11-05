# First-session pentatonic orientation

## STORY-UNASSIGNED: Identify the default position

**Type**: short
**Topic**: First-session pentatonic orientation
**Persona**: New guitarist
**Goal**: Understand the default A minor pentatonic study before changing it.
**Preconditions**: Fresh browser storage; app opens in its default workspace.
**Ideal path**: 2 steps — the starting key, scale, and active form should be evident, then the learner can inspect a note.
**Alternate paths**: The learner can open Guide for an explanation, or inspect a fretboard note directly.

### Steps
1. Open Fret Atlas → the header identifies A minor and the Study controls show Key A, Scale Minor pentatonic, and Position.
2. Hover or focus a visible fretboard note → its pitch, octave, degree, and string/fret appear in the inspector and tooltip.

### Variations
- Keyboard learner: Tab into a note and use arrow keys to move before reading the inspector.
- Visual learner: reads the rectangle and stack legend on the board.

### Edge Cases
- A small viewport hides the header’s tuning sentence but retains the primary key/scale controls.

## STORY-UNASSIGNED: Move between pentatonic forms

**Type**: medium
**Topic**: First-session pentatonic orientation
**Persona**: New guitarist learning all five forms
**Goal**: Compare Form 1 with Form 2 and return to the starting form.
**Preconditions**: A named pentatonic scale is selected in Position view.
**Ideal path**: 3 steps — choose a form, inspect it, choose the original form.
**Alternate paths**: Previous/Next form arrows reach the same forms as the 1–5 picker.

### Steps
1. Select Form 2 from the Pentatonic form picker → the board and fret range change to Form 2.
2. Read the form’s visible frets and inspect a note → the learner relates the form to the neck.
3. Select Form 1 → the initial position returns.

### Variations
- Use Next form then Previous form instead of direct form buttons.
- In Practice, completed/seen progress dots appear on the same picker.

### Edge Cases
- Selecting a form that needs more frets extends the neck setting as needed.

## STORY-UNASSIGNED: Learn what the colored outlines mean

**Type**: medium
**Topic**: First-session pentatonic orientation
**Persona**: Curious beginner
**Goal**: Understand rectangle and stack pattern overlays in the active position.
**Preconditions**: Position view with both pattern families enabled.
**Ideal path**: 3 steps — read the legend, filter a family, restore both.
**Alternate paths**: Guide’s “Study one form at a time” section explains the same concepts in more detail.

### Steps
1. Read the board legend → rectangle and stack labels identify the visible outlines.
2. Select Rectangles in Pattern families → only rectangle outlines remain.
3. Select Both → both pattern families return.

### Variations
- Select Stacks instead of Rectangles.
- Hover a note to see its shape membership in the inline tooltip.

### Edge Cases
- If a pattern cannot fit the selected strings/frets, a status notice explains that notes still remain visible.

## STORY-UNASSIGNED: Get help without losing the study state

**Type**: short
**Topic**: First-session pentatonic orientation
**Persona**: First-time learner
**Goal**: Open the guide, understand Position versus Shape, then continue studying.
**Preconditions**: Any Explore workspace state.
**Ideal path**: 3 steps — open guide, find the relevant explanation, close it.
**Alternate paths**: The learner can infer the distinction by using the Study view controls, but that changes the board.

### Steps
1. Click Guide → the modal opens over the unchanged workspace.
2. Read “Study one form at a time” → Position, Shape, and Diagonal are described.
3. Close guide → focus returns to Guide and the workspace remains unchanged.

### Variations
- Click outside the dialog to close it.

### Edge Cases
- The guide also explains note marking and keyboard navigation for a learner who avoids pointer input.

## STORY-UNASSIGNED: Mark notes for a short study session

**Type**: medium
**Topic**: First-session pentatonic orientation
**Persona**: Learner identifying root notes to revisit
**Goal**: Mark two fretboard positions and clear them when finished.
**Preconditions**: Explore mode; at least two visible notes.
**Ideal path**: 3 steps — mark positions, review them, clear all.
**Alternate paths**: Press Enter on a focused note instead of clicking; remove one mark from its card instead of clearing all.

### Steps
1. Click two notes → each becomes marked and the marked-positions panel appears.
2. Review pitch/string/fret cards in the panel → each card identifies the selected location.
3. Click Clear marks → the marks and panel disappear.

### Variations
- Click an individual marked-position card to unmark only that note.

### Edge Cases
- Marks outside a newly shortened neck remain listed as “off screen.”
