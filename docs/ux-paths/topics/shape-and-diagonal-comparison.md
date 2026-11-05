# Shape and diagonal comparison

## STORY-UNASSIGNED: Isolate one rectangle shape

**Type**: medium
**Topic**: Shape and diagonal comparison
**Persona**: Intermediate guitarist comparing movable geometry
**Goal**: View one rectangle in the current pentatonic form.
**Preconditions**: A pentatonic scale is selected.
**Ideal path**: 3 steps — switch to Shape, choose Rectangle, step to a shape.
**Alternate paths**: Position view’s Pattern families filter can show all rectangles in a form, but does not isolate one.

### Steps
1. Select Shape in Study view → an individual pattern becomes the study subject.
2. Select Rectangle in Shape family → the board shows a rectangle shape.
3. Use Next form or Previous form → another rectangle instance becomes active.

### Variations
- Choose Stack instead of Rectangle.
- Directly alter the key before selecting Shape to compare the same geometry elsewhere.

### Edge Cases
- Shape is disabled with an explanatory hint if the selected scale has no pentatonic family.

## STORY-UNASSIGNED: Compare rectangles and stacks in Position

**Type**: short
**Topic**: Shape and diagonal comparison
**Persona**: Pattern-oriented learner
**Goal**: See how the two shape families occupy the same playing position.
**Preconditions**: Position view, named pentatonic scale.
**Ideal path**: 3 steps — rectangles, stacks, then both.
**Alternate paths**: The Whole neck view exposes both families across the neck.

### Steps
1. Choose Rectangles in Pattern families → only red rectangle outlines remain.
2. Choose Stacks → only blue stack outlines remain.
3. Choose Both → shared edges display both colors.

### Variations
- Hover a shared note to see Rectangle and Stack membership.

### Edge Cases
- Excluding a string in Pattern strings can remove patterns that depend on it while leaving notes visible.

## STORY-UNASSIGNED: Trace a diagonal pattern

**Type**: medium
**Topic**: Shape and diagonal comparison
**Persona**: Learner connecting shapes across strings
**Goal**: Follow a repeated rectangle or stack across the neck.
**Preconditions**: Named pentatonic scale; adequate neck length.
**Ideal path**: 4 steps — switch to Diagonal, select family, inspect continuation, fit if necessary.
**Alternate paths**: Guide’s “Follow a diagonal” describes the same hollow continuation tones.

### Steps
1. Select Diagonal in Study view → a repeated diagonal chain is shown.
2. Select Rectangle or Stack → the chain changes family.
3. Inspect a hollow continuation tone → its board legend explains it is the next scale note beyond the block.
4. Enable Fit neck to screen when the long neck overflows → the chain fits the viewport.

### Variations
- Use the form arrows to trace a different diagonal.

### Edge Cases
- Fit neck is offered for diagonal views and on desktop is visually needed only for longer necks.

## STORY-UNASSIGNED: Reveal adjacent positions while staying in context

**Type**: medium
**Topic**: Shape and diagonal comparison
**Persona**: Learner preparing to move between positions
**Goal**: See neighboring forms without losing the active form.
**Preconditions**: Position view, named pentatonic scale.
**Ideal path**: 2 steps — enable neighboring positions, inspect them.
**Alternate paths**: From another view, Connect positions temporarily borrows Position with ghost forms, then returns to the prior view when toggled off.

### Steps
1. Click Connect positions → neighboring forms appear as violet ghost outlines.
2. Hover a note near a boundary → inspect its relationship to the active and neighboring patterns.

### Variations
- Toggle Connect positions off to restore the uncluttered form.

### Edge Cases
- In Position, the setting persists in the saved view; changing Study view ends a temporary connection view.

## STORY-UNASSIGNED: Hear the active form

**Type**: short
**Topic**: Shape and diagonal comparison
**Persona**: Ear-led learner
**Goal**: Hear notes of the active Position form in fingered order.
**Preconditions**: Explore mode, sound enabled, Position view.
**Ideal path**: 2 steps — start playback, stop or let it finish.
**Alternate paths**: Practice’s Play through uses a related playback flow and awards progress credit.

### Steps
1. Click Play → each active note lights while it is sounded from low to high.
2. Click Stop or wait for playback → the board returns to its normal state.

### Variations
- Change Form then use Play again to compare fingerings.

### Edge Cases
- If sound is disabled, playback safely produces no audio; settings exposes the sound toggle.
