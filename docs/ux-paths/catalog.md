# UX Path Catalog: Fret Atlas

Generated: 2026-11-05

Total stories: 50
Coverage: 6 / 6 feature areas (100%)

## Summary

| Type | Count |
|---|---:|
| Short | 20 |
| Medium | 30 |
| Long | 0 |

## Coverage Matrix

| Feature area | Stories | Gaps |
|---|---|---|
| Study workspace | STORY-001–005, 031–035, 046–050 | Optional account sign-in is not exercised because it does not affect Atlas data or study access. |
| Explore tools | STORY-006–010, 016–020 | None found. |
| Practice | STORY-021–030 | None found. |
| Instrument and accessibility | STORY-011–015, 041–045 | System-level reduced-motion setting is represented as a precondition, not controllable UI. |
| Sharing and persistence recovery | STORY-036–040 | Invalid share URL/legacy migration are described in discovery but need a deterministic browser fixture to walk. |
| Responsive interaction | STORY-041–045, 047 | None found. |

## Story Dependency Graph

```text
STORY-001 (Orient in the default position)
├── STORY-002 (Move between forms)
│   ├── STORY-031–035 (Compare shapes and diagonals)
│   ├── STORY-046–050 (Use whole-neck and linear views)
│   └── STORY-021–025 (Run drills)
│       └── STORY-026–030 (Review and retain progress)
├── STORY-003 (Read pattern overlays)
│   └── STORY-006–010 (Focus the workspace)
├── STORY-016–020 (Explore notes, degrees, and chords)
│   └── STORY-021–025 (Practice notes, degrees, and chords)
├── STORY-011–015 (Adapt instrument and access preferences)
│   └── STORY-041–045 (Study on a small screen)
└── STORY-036–040 (Share and resume a workspace)
```

## Consolidation Notes

The catalog retains stories that touch the same control when their user goal differs. For example, STORY-005 and STORY-020 both mark notes, but the first teaches the basic study action while the second tests keeping marks through a change in note presentation. Stories are otherwise distinct by outcome, state transition, or recovery behavior.

## All stories

### STORY-001: Identify the default position

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

### STORY-002: Move between pentatonic forms

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

### STORY-003: Learn what the colored outlines mean

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

### STORY-004: Get help without losing the study state

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

### STORY-005: Mark notes for a short study session

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

### STORY-006: Narrow practice to a fret range and strings

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

### STORY-007: Reduce visual context around a position

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

### STORY-008: Hide pattern outlines on excluded strings

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

### STORY-009: Restore only a changed configuration panel

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

### STORY-010: Return to a saved workspace

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

### STORY-011: Configure an all-fourths neck
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

### STORY-012: Mirror the board for a left-handed player
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

### STORY-013: Use keyboard note navigation
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

### STORY-014: Reduce animation and silence playback
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

### STORY-015: Reset display preferences but retain study choices
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

### STORY-016: Read scale degrees on the map

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

### STORY-017: Isolate a scale degree, then restore the full scale

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

### STORY-018: Build and hear a chord over a scale

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

### STORY-019: Turn a named scale into a custom note set

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

### STORY-020: Mark notes to compare later

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

### STORY-021: Find a prompted note and recover from a miss

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

### STORY-022: Practice selected scale degrees with assistance

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

### STORY-023: Find chord tones beyond the current scale

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

### STORY-024: Ask for a hint, reveal answers, and move on

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

### STORY-025: End a drill and resume the same board

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

### STORY-026: Earn credit by playing Form 1
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

### STORY-027: Finish a drill to earn credit
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

### STORY-028: Choose a new key from progress
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

### STORY-029: Preserve progress across a reload
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

### STORY-030: Clear device-only progress
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

### STORY-031: Isolate one rectangle shape

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

### STORY-032: Compare rectangles and stacks in Position

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

### STORY-033: Trace a diagonal pattern

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

### STORY-034: Reveal adjacent positions while staying in context

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

### STORY-035: Hear the active form

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

### STORY-036: Copy the current study view
**Type**: short
**Topic**: Sharing and persistence recovery
**Persona**: Teacher preparing an example for a student
**Goal**: Copy a link that opens the same workspace.
**Preconditions**: A customized study view.
**Ideal path**: 1 step; select Share.
**Alternate paths**: None found.
### Steps
1. Select **Share** → the browser clipboard receives a URL with the serialized workspace and a “View link copied” toast appears.
### Variations
- Marks, study form, tuning, and visual workspace state are included.
- Theme, sound, progress, and an active drill are not included.
### Edge Cases
- Clipboard denial switches to a selectable manual link.

### STORY-037: Recover from clipboard denial
**Type**: short
**Topic**: Sharing and persistence recovery
**Persona**: Learner in a browser without clipboard permission
**Goal**: Manually copy the share URL.
**Preconditions**: Clipboard API write fails.
**Ideal path**: 2 steps; invoke Share and copy the selected field.
**Alternate paths**: None found.
### Steps
1. Select **Share** → a toast says “Select and copy your view link.”
2. Focus the **View link** field → its URL selects so it can be copied manually.
### Variations
- A later successful Share removes the fallback field.
- The URL can be copied with the platform keyboard shortcut.
### Edge Cases
- The fallback has no external send action; the user decides where to paste it.

### STORY-038: Open a shared view without overwriting device preferences
**Type**: medium
**Topic**: Sharing and persistence recovery
**Persona**: Student receiving a teacher’s link
**Goal**: Load the teacher’s map and keep local sound/theme/progress.
**Preconditions**: A valid Fret Atlas URL contains `atlas` state.
**Ideal path**: 1 step; open the URL.
**Alternate paths**: None found.
### Steps
1. Open the shared URL → its key, scale, view, marks, and display workspace appear.
2. Open Practice → device progress still reflects the student’s local records.
3. Open Settings → sound and dark-mode remain local preferences.
### Variations
- The shared state becomes the device’s saved workspace after loading.
- A teacher can share a focused fret/string range.
### Edge Cases
- Invalid share data falls back to saved or default workspace.

### STORY-039: Recover after storage becomes unavailable
**Type**: medium
**Topic**: Sharing and persistence recovery
**Persona**: Learner in a privacy-restricted browser
**Goal**: Keep working and preserve the study state externally.
**Preconditions**: Browser local storage throws while saving.
**Ideal path**: 2 steps; continue working and use Share.
**Alternate paths**: None found.
### Steps
1. Change a study control → the footer changes to “Storage unavailable · use Share view.”
2. Select **Share** → a serializable link captures the current view for later reopening.
### Variations
- UI interactions remain usable even while persistence fails.
- Clipboard fallback remains available.
### Edge Cases
- Device-local progress and preferences cannot be guaranteed to persist.

### STORY-040: Resume the saved workspace
**Type**: short
**Topic**: Sharing and persistence recovery
**Persona**: Returning learner
**Goal**: Continue the last study setup.
**Preconditions**: A valid workspace was saved locally.
**Ideal path**: 1 step; revisit the app.
**Alternate paths**: A shared URL supersedes saved workspace on startup.
### Steps
1. Reopen Fret Atlas → the latest key, scale, view, controls, and marks reappear.
### Variations
- Legacy stored shapes are migrated where valid.
- With no stored state, A minor pentatonic Form 1 is shown.
### Edge Cases
- Corrupt local storage falls back safely to defaults.

### STORY-041: Fit a diagonal map on a phone
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

### STORY-042: Scroll a non-fitted long neck
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

### STORY-043: Start a drill with touch-sized controls
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

### STORY-044: Change forms without losing the board
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

### STORY-045: Open responsive Explore controls
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

### STORY-046: Survey every pattern on the neck

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

### STORY-047: Fit the long neck to a narrow screen

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

### STORY-048: Study the scale on one string

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

### STORY-049: Use a seven-note scale in 3 notes/string view

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

### STORY-050: Compare a complete map with a focused range

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

## Redundancy Candidates

### Duplicate paths (same goal, multiple routes)

- Move between pentatonic forms: direct Form 1–5 buttons and Previous/Next arrows lead to the same state. This is an intentional direct-selection plus sequential-navigation pair; both should remain, with matching form labels.
- Clear selected scale degrees: re-clicking an active degree and **Show all degrees** return the full scale. The explicit command is clearer for multiple selections; the re-click behavior is a useful shortcut.
- Restore configuration: a module-level **Restore defaults** and Settings-level **Reset view** overlap in recovery intent but differ in scope. Keep both, provided scope remains explicit.
- Recover a saved workspace: reload restores local state, while Share restores serialized state. They serve local continuation and cross-device transfer respectively.

### Duplicate information (same fact, multiple surfaces)

- Current key, scale, and form appear in the board header, Study controls, and Practice context. They serve orientation in separate contexts, but the naming must stay identical.
- Note identity appears in a note tooltip and the persistent inspector. The tooltip supports immediate hover feedback; the inspector supports keyboard use and sustained reading.
- Chord root and quality appear in Explore and Practice. Practice intentionally inherits Explore’s chord selection; copy should explain that continuity.
- Form progress appears on form-picker dots and the per-key progress grid. Picker dots give local context; the grid supports planning across keys.

### Overlapping features/tools

- Focus strings restrict note interaction and drill targets, while Pattern strings hide only pattern outlines. The concepts are adjacent but not interchangeable; their descriptions should make the different consequences explicit.
- Pattern-family filters and the Shape study view both narrow geometry. Filters compare families inside a view; Shape isolates one named block. Preserve both while keeping the distinction visible.
- **Fit neck to screen** and horizontal board scrolling both make a long neck usable on small screens. One favors overview and the other preserves detail; they are complementary modes.

### Hierarchy & IA

- Explore/Practice is the top-level mode switch. The fretboard and Study controls remain shared above it, correctly reflecting their shared role.
- Advanced configuration is distributed across Overlays, Focus, and Settings. This is logical by scope, but the relationship between Focus strings and Pattern strings is the main naming-risk area.

## Gaps & Recommendations

- Add deterministic browser fixtures for malformed share URLs and legacy local-storage migration before walking those recovery cases.
- Add an explicit end-to-end first-session story that combines orientation, a form change, one inspected note, and a short drill. The present catalog covers those actions independently, but not as one long newcomer journey.
- Optional Clerk sign-in and account sync are covered by `tests/sync.spec.ts` rather than these stories. Add account stories (first-sign-in import, conflict choices, sync status) to the walk plan before launch.
