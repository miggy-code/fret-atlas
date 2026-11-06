# App Discovery: Fretory

## Application Type

Single-page, client-side guitar-fretboard study web app. It runs entirely in the browser; device preferences, progress, and the current workspace persist in local storage. A share link serializes the workspace state in its `atlas` query parameter.

## Tech Stack

- React 19, TypeScript, Vite
- Browser local storage for workspace, theme, sound, and progress
- SVG fretboard with mouse, touch, and keyboard note interaction
- Web Audio synthesis for note/chord playback
- Optional Clerk accounts when a publishable key is configured; signed-in view, preferences and progress sync through Supabase

## User Roles

- New guitarist: opens the default A minor pentatonic map and needs to understand the first position.
- Returning learner: reopens a saved device workspace or a shared URL and continues a study session.
- Deliberate practicer: selects a drill, finds notes on the board, and tracks form progress by key.
- Advanced explorer: compares rectangle/stack geometry, alternate tunings, note representations, triads, and focused ranges.
- Signed-in user (optional): can sign in/out, manage their Clerk account, and sync view, preferences and progress across devices. Signed-out use stays local to the device.

## Feature Map

### Study workspace

- Select key/reference and named scale or custom pitch set.
- Choose Position, Shape, Diagonal, Whole neck, One string, or 3 notes/string views.
- Navigate study forms with previous/next or choose forms 1–5 directly.
- Filter rectangle/stack pattern families; select the studied family in Shape/Diagonal.
- Connect neighboring positions; play the active form in Explore.
- Fit long diagonal/whole-neck maps to the visible viewport.
- Inspect a note by hover/focus and mark/unmark it by click or keyboard.
- Clear marked positions; marked notes remain part of the saved/shared workspace.

### Explore tools

- Change note labels (notes, intervals, both, dots/charms) and color treatment.
- Isolate scale degrees through the tone strip.
- Configure and show/hide a major or minor chord, select its root, and hear it.
- Expand Overlays for Whole map, Skeleton, Warp, Pentatonic only, contextual notes, and visible pattern strings.
- Expand Focus to limit the fret and string range.
- Restore an individual control module to its defaults.

### Practice

- Start Find notes, Find scale degrees, Find chord tones, or Play through.
- Use a drill hint, reveal answers, skip a prompt, or end the drill.
- Receive correctness feedback, streak/best streak, completion timing, and automatic next prompts.
- Review position-form progress per key/family and select another key from the progress grid.
- Clear saved progress.

### Instrument and application settings

- Configure tuning, fret count, spelling, handedness, string names, dark mode, and sound.
- Reset display settings while preserving musical selection and marks.
- Open the guide dialog; copy a shareable workspace link.

### Responsive and accessibility interaction

- Use the fretboard via tab/arrow/Enter keyboard controls.
- Horizontally scroll only the fretboard on narrow viewports, or fit applicable views.
- Honor reduced-motion preferences.
- Expose note identity and fretboard instructions with ARIA labels/status text.

## Navigation Structure

The single workspace has no routes or sidebar. The header provides Share, Guide, Settings, plus the Explore/Practice tab switch. Study controls configure the board above it. The board is the central interaction surface. Each tab adds a distinct deck immediately around the board: Explore provides labels, scale degrees, chord, overlays, and focus; Practice provides drill choices and progress. Dialogs contain Guide and Settings.

## Data Entities

- Workspace view: key, scale/custom pitches, study view/form, visual controls, focus, tuning, and marked positions; create/update through controls, read from local storage or a shared URL, reset selectively.
- Guitar note position: string/fret identity with derived pitch, octave, scale degree, pattern membership; read/inspect, mark/unmark, answer drill prompts.
- Shape/study: calculated pentatonic positions, rectangle/stack blocks, diagonals, and whole-neck patterns; selected/read through study controls.
- Drill session: ephemeral target set, found/missed positions, hint/reveal state, streak, and rounds; begins/ends in Practice.
- Practice progress: per key, scale family, and form; read/update/clear in local storage.
- Device preferences: theme, sound, and best streak; read/update in local storage.

## Integrations

- Optional Clerk authentication; Supabase stores owner-scoped sync data verified from the Clerk session token.
- Browser Clipboard API for Share, with a visible fallback field when copying fails.
- Browser Web Audio API for synthesized playback.

## State Transitions

- Startup resolves a share URL first, then current/legacy local storage, otherwise default A minor pentatonic Form 1.
- Selecting custom notes moves the workspace from a named scale to Custom; unavailable pentatonic and 3NPS study views are disabled with hints.
- Starting a drill enters a focused practice state that hides study hints and overlays; ending or switching tabs restores the previous workspace exactly and returns focus to its starter.
- Changing a form can increase the fret count to make that form available.
- State changes persist locally; a shared URL contains the workspace but deliberately excludes device-only sound, theme, progress, and drills.

## Error States and Recovery

- Invalid or malformed shared URLs fall back to local/default state.
- Unavailable storage leaves the app usable and offers sharing as a workaround.
- Clipboard failure shows a selectable manual link.
- A drill with no eligible targets explains how to recover by changing the scale or focus.
- Unsupported study views are disabled and explain their prerequisites.
- Each expandable Explore module has an independent Restore defaults action; Settings has Reset view.

## Recommended Story Topics

1. First-session pentatonic orientation — map the initial Position experience, form navigation, note inspection, and Guide discovery.
2. Shape and diagonal comparison — explore rectangle/stack geometry, pattern filtering, connect positions, and playback.
3. Whole-neck and linear scale views — compare Whole neck, One string, and 3 notes/string, including responsive fitting.
4. Note and chord exploration — labels, colors, degree isolation, triad/chord controls, and sound.
5. Focused workspace configuration — overlays, string/fret focus, restoration, custom notes, and saved state.
6. Practice drills — note, degree, and chord drills, feedback, assistance, recovery, and exiting.
7. Practice progress and replay — play-through credit, progress grid navigation, persistence, and clearing progress.
8. Instrument and accessibility preferences — tuning, handedness, fret count, spelling, keyboard interaction, dark mode, sound, and reduced motion.
9. Sharing and persistence recovery — copy/share a view, open a serialized view, invalid links, storage/clipboard fallback, and legacy migration.
10. Small-screen study — board scrolling/fit neck and control wrapping at mobile widths.
