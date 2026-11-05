# Practice drills

## STORY-TBD: Find a prompted note and recover from a miss

**Type**: medium
**Topic**: Practice drills
**Persona**: New practicer
**Goal**: Complete a Find notes round without exposing the answer before attempting it.
**Preconditions**: A playable study view is selected.
**Ideal path**: 3 steps. Enter Practice, start the drill, tap every target.
**Alternate paths**: The prompt can target one string or the active form depending on the selected view.

### Steps
1. Switch to **Practice** and choose **Start** under Find notes.
2. Read the prompt above the fretboard and tap a target note → it reveals and the progress indicator advances.
3. Continue until every target is found → feedback gives completion time and the next prompt follows automatically.

### Variations
- Tap a wrong note → it briefly shows a miss, names that note, resets the current streak, and keeps the round active.
- Tap an already-found target → it can be replayed without advancing the round.

### Edge Cases
- If no targets fit the selected scale or focus, the drill explains that the user should change the scale or clear focus.

## STORY-TBD: Practice selected scale degrees with assistance

**Type**: medium
**Topic**: Practice drills
**Persona**: Learner rehearsing intervals
**Goal**: Practice the root and flat third in the active view, then request help without receiving progress credit.
**Preconditions**: Practice is open on a named scale.
**Ideal path**: 4 steps. Choose degrees, start, use a hint only when needed, find targets.
**Alternate paths**: Start Find notes for a random scale tone rather than a selected degree subset.

### Steps
1. In Find scale degrees, select the root and flat third chips.
2. Choose **Start**.
3. If stuck, choose **Hint** → one remaining answer highlights.
4. Find the remaining answers or choose **Reveal** to see all answers, then **Next** to continue.

### Variations
- Selecting an additional degree updates the request without altering Explore’s degree isolation.
- End returns focus to Find scale degrees with the chosen chips still selected.

### Edge Cases
- Any hint or reveal marks the round assisted, so it does not count as a practiced form.

## STORY-TBD: Find chord tones beyond the current scale

**Type**: medium
**Topic**: Practice drills
**Persona**: Intermediate guitarist
**Goal**: Locate a chord whose tones are not all members of the displayed scale.
**Preconditions**: Practice is active; any view with visible notes is selected.
**Ideal path**: 4 steps. Select chord root and quality, start, find root/third/fifth.
**Alternate paths**: Set the same chord first in Explore; the controls carry its root and quality into Practice.

### Steps
1. Set Chord root to C♯ and quality to major.
2. Choose **Start** under Find chord tones.
3. Read the C♯ major chord prompt and tap each eligible target.
4. End or accept the next prompt after completion.

### Variations
- Change key or study view before starting; the drill uses the currently visible/focused board.

### Edge Cases
- The target set includes root, third, and fifth whether or not they belong to the selected scale.

## STORY-TBD: Ask for a hint, reveal answers, and move on

**Type**: short
**Topic**: Practice drills
**Persona**: Frustrated learner
**Goal**: Exit an unproductive prompt without changing the underlying study workspace.
**Preconditions**: Any active drill is running.
**Ideal path**: 2 steps. Reveal or skip, then continue to the next prompt.
**Alternate paths**: Hint preserves a remaining answer challenge; Next starts a new prompt directly.

### Steps
1. Choose **Reveal** → answers become visible and feedback explains the state.
2. Choose **Next** → a fresh prompt replaces the revealed one.

### Variations
- Choose Hint first to see one answer instead of all answers.

### Edge Cases
- Hint and Reveal are disabled after Reveal, preventing repeated assistance actions on the same round.

## STORY-TBD: End a drill and resume the same board

**Type**: short
**Topic**: Practice drills
**Persona**: Returning learner
**Goal**: Stop a drill and continue configuring practice without losing the selected view.
**Preconditions**: A drill is running from Practice.
**Ideal path**: 1 step. End the drill.
**Alternate paths**: Switch tabs; the active drill ends and the selected tab becomes active.

### Steps
1. Choose **End** → hints and hidden answers are removed, the original workspace returns, and focus moves to the control that started the drill.

### Variations
- Start a different drill immediately from the reappeared Practice deck.

### Edge Cases
- A drill does not persist across reloads; workspace and progress do.
