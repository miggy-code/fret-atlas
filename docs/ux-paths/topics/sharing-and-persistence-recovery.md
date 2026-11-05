# Sharing and persistence recovery

## STORY-901: Copy the current study view
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

## STORY-902: Recover from clipboard denial
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

## STORY-903: Open a shared view without overwriting device preferences
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

## STORY-904: Recover after storage becomes unavailable
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

## STORY-905: Resume the saved workspace
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
