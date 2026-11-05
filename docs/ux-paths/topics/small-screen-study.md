# Small-screen study

## STORY-1001: Fit a diagonal map on a phone
**Type**: medium
**Topic**: Small-screen study
**Persona**: Phone-based learner
**Goal**: See all string names and the diagonal pattern without horizontal page scanning.
**Preconditions**: Approximately 390px viewport, Diagonal view.
**Ideal path**: 2 steps; choose Diagonal and enable Fit neck.
**Alternate paths**: Leave Fit neck off and scroll the fretboard horizontally.
### Steps
1. Select **Diagonal** → the full neck can extend beyond the narrow viewport.
2. Select **Fit neck to screen** → the board scales to fit, retaining all six string names.
### Variations
- Left-handed display preserves visible string names.
- The control’s pressed state signals fitted mode.
### Edge Cases
- Fitting only appears for Diagonal and Whole neck views.

## STORY-1002: Scroll a non-fitted long neck
**Type**: short
**Topic**: Small-screen study
**Persona**: Learner who needs note labels at full size
**Goal**: Inspect the whole neck without reducing its scale.
**Preconditions**: Narrow viewport, long Diagonal or Whole neck map.
**Ideal path**: 1 step; leave Fit neck off and scroll the board area.
**Alternate paths**: Enable Fit neck to replace scrolling with scaling.
### Steps
1. Horizontally scroll the fretboard shell → off-screen frets become reachable while the page controls remain fixed to the layout.
### Variations
- Change neck length in the study controls.
- Switch back to Position for a naturally compact board.
### Edge Cases
- The narrow layout hides the verbose board-tuning line to preserve space.

## STORY-1003: Start a drill with touch-sized controls
**Type**: medium
**Topic**: Small-screen study
**Persona**: Learner on a phone between practice sessions
**Goal**: Start a notes drill and act on the board.
**Preconditions**: Narrow viewport, initial Position view.
**Ideal path**: 3 steps; Practice, Start, tap a fretboard note.
**Alternate paths**: Use keyboard controls where a hardware keyboard is connected.
### Steps
1. Select **Practice** → tabs span the available width.
2. Select **Start** under Find notes → the drill prompt appears above the board.
3. Tap a note → feedback and progress remain near the active fretboard.
### Variations
- Degree pick buttons and Start controls use the mobile minimum touch height.
- End returns focus to the drill’s start control.
### Edge Cases
- A no-target drill explains that another scale or focus range is needed.

## STORY-1004: Change forms without losing the board
**Type**: short
**Topic**: Small-screen study
**Persona**: Learner comparing pentatonic positions
**Goal**: Move between Forms 1–5 from a compact control row.
**Preconditions**: Narrow viewport, pentatonic Position view.
**Ideal path**: 1 step; tap a Form number.
**Alternate paths**: Previous/next form controls reach the same result.
### Steps
1. Tap **Form 3** in the full-width picker → Form 3 appears and its fitting fret range is used.
### Variations
- Practice renders small progress dots on form numbers.
- Form availability follows the selected key and scale family.
### Edge Cases
- Custom or non-family scales disable pentatonic-specific study modes.

## STORY-1005: Open responsive Explore controls
**Type**: medium
**Topic**: Small-screen study
**Persona**: Explorer adjusting labels and focus on a phone
**Goal**: Change a visual option without losing the core board context.
**Preconditions**: Narrow viewport, Explore tab.
**Ideal path**: 3 steps; open a module, choose the setting, close/collapse.
**Alternate paths**: Note labels are also influenced by tone and chord displays in Explore.
### Steps
1. Select **Explore** → note-view choices wrap to the viewport.
2. Open **Overlays** or **Focus** → controls use a single-column mobile layout.
3. Toggle a setting → the board updates and the module shows Changed with a local restore option.
### Variations
- Chord and degree controls stack into readable rows.
- Header actions wrap below the title.
### Edge Cases
- No module reset changes the selected key, scale, marks, or study mode.
