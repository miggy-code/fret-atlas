# Practice progress and replay

## STORY-701: Earn credit by playing Form 1
**Type**: short
**Topic**: Practice progress and replay
**Persona**: Returning learner
**Goal**: Mark the current A minor position as practiced.
**Preconditions**: A minor pentatonic, Position view, Form 1.
**Ideal path**: 2 steps; choose Practice and play the available form.
**Alternate paths**: Completing any unassisted drill in the same Position form also grants credit.
### Steps
1. Select **Practice** → the deck states “Practicing A minor in Form 1.”
2. Select **Play through** → the form plays low to high and Form 1 becomes practiced.
### Variations
- If playback is already running, the button becomes **Stop**.
- Explore’s **Play** is listening only and grants no credit.
### Edge Cases
- Outside Position or a pentatonic family, Play through is disabled with its prerequisite copy.

## STORY-702: Finish a drill to earn credit
**Type**: medium
**Topic**: Practice progress and replay
**Persona**: Deliberate practicer
**Goal**: Practice Form 2 by finding its notes.
**Preconditions**: Minor pentatonic Position view.
**Ideal path**: 4 steps; select a form, start, find every target, let completion record it.
**Alternate paths**: Play through grants the same form-level credit.
### Steps
1. Choose **Form 2**.
2. Open **Practice** and start **Find notes**.
3. Tap each hidden target on the fretboard → correct notes reveal and progress pips fill.
4. Finish the round → completion feedback plays answers and the Form 2 marker becomes practiced.
### Variations
- Use **Next** to abandon a prompt without earning credit.
- A hinted or revealed round completes without credit.
### Edge Cases
- A miss resets the streak but does not erase existing progress.

## STORY-703: Choose a new key from progress
**Type**: medium
**Topic**: Practice progress and replay
**Persona**: Learner rotating through keys
**Goal**: Resume C minor practice after reviewing key progress.
**Preconditions**: Practice tab, minor family selected.
**Ideal path**: 2 steps; choose Practice, then C from the progress grid.
**Alternate paths**: The root selector above the board can set C; both change the active key.
### Steps
1. Open **Practice** → see the Progress summary for the active key and the 12-key grid.
2. Select the **C minor** key cell → the root control and board update to C; its 0–5 form total is shown.
3. Select a Form button or drill → the chosen C position is practiced.
### Variations
- A complete key cell receives its completed styling.
- Key spelling changes labels in the grid.
### Edge Cases
- Progress is separate for minor and major families.

## STORY-704: Preserve progress across a reload
**Type**: medium
**Topic**: Practice progress and replay
**Persona**: Returning learner
**Goal**: Confirm yesterday’s practice survived a browser reload.
**Preconditions**: At least one practiced Form in local storage.
**Ideal path**: 2 steps; reload and open Practice.
**Alternate paths**: None found.
### Steps
1. Reload Fret Atlas → stored workspace and progress are restored.
2. Choose **Practice** → Form markers and the key-grid counts show previous credit.
3. Select a previously practiced key → its form ring retains completed segments.
### Variations
- A share link restores the shared workspace but excludes device-only progress.
- Progress uses the current minor/major family.
### Edge Cases
- Malformed progress storage is ignored and starts empty.

## STORY-705: Clear device-only progress
**Type**: short
**Topic**: Practice progress and replay
**Persona**: Learner beginning a new curriculum
**Goal**: Remove all saved form progress.
**Preconditions**: At least one progress record exists.
**Ideal path**: 2 steps; choose Clear progress and confirm.
**Alternate paths**: None found.
### Steps
1. Open **Practice** and locate the Progress footer.
2. Select **Clear progress** and accept “Clear all progress on this device?” → all rings and counts reset.
### Variations
- Cancelling the browser confirmation keeps all progress.
- The clear control is absent when nothing is recorded.
### Edge Cases
- Clearing minor progress records also removes stored major records because storage is one device-level progress object.
