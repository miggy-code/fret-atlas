# Fret Atlas: integrated scale and shape workspace

## Goal and current scope

An accurate guitar map that stays readable with or without note and string labels. Scales, Fret Science-style rectangle/stack geometry, spatial focus, and manually marked fingerings share the same coordinate model.

Implemented: custom notes; minor/major pentatonic and blues; major; natural minor; Dorian; Mixolydian; five pentatonic position forms; isolated rectangle/stack views; diagonal chains; whole-map context; root-note skeleton; G–B warp guide; dark mode; independent major/minor triad highlighting with an optional root override. Alternate tunings and guided practice are not implemented.

## Visual grammar

- One continuous studio panel: study heading, consolidated controls, fretboard canvas, tone palette, and inspection footer. A deep blue header and restrained instrument colors establish hierarchy.
- Root markers have a contrasting center dot, including in Dots mode. Pentatonic tones are solid. Added scale tones are hollow. Manual marks add an independent amber ring.
- Rectangle outlines are rust and stack outlines blue. Both use unfilled paths with non-scaling strokes and a narrow neck-colored underlay to separate them from strings and fret wires. Straight diagonal rails join the shifted G–B endpoints. Each position assigns a string to one block, avoiding overlapping red and blue edges. Outer-string fragments use open rails and short continuation stubs. Pattern-string filters remove whole patterns touching excluded strings.
- The selected form's scale tones are prominent. Whole map adds other scale tones at low opacity. Outline visibility never hides notes. Unrelated chromatic notes are hidden by default and can be shown separately.
- In position, Shape and Diagonal select the study geometry; arrows select the next or previous available form. Ghost forms displays faint dashed outlines of adjacent forms to visualize the interlocking puzzle across the neck. Skeleton joins roots across the neck. Warp displays the tuning boundary and two-way shift arrow. Neither toggle changes the shape geometry. The nut, fret numbers, inlays, and increasing string weights preserve orientation.
- Notes / Intervals / Both / Dots change labels only. The geometry, note identities, and marks do not change. An inline note HUD directly adjacent to the active or hovered note displays its pitch, octave, interval degree, and pattern membership. Accessible names and hover tooltips retain pitch, octave, interval, and membership in every mode.
- Degree colors gives non-root scale tones an interval-based hue and sits in the primary secondary toolbar. In named scale modes, clicking any tone chip in the bottom tone strip isolates that degree across the neck, dimming other degrees for targeted interval practice.
- Optional triads use a soft green halo, separate from root color, pattern outlines, and manual mark rings. A triad can follow the study key or use a fixed root. Out-of-scale chord tones use pale markers without altering the selected pitch set. Focus still limits their visibility; explicit marks remain visible.
- String names have their own Display toggle. It leaves row spacing unchanged.
- The note palette combines pitch selection with interval information. Editing it explicitly changes the study to Custom notes and disables shape overlays, so stale scale names cannot misrepresent the board.
- A selected-position summary appears in one line. Mark chips appear only when there are marked notes. Secondary settings remain in Display; spatial filters expand from Focus.

## Musical model

Physical string/fret identity is separate from MIDI sounding pitch and displayed spelling. High and low E are distinct strings. Fret 0 is outside the nut; fretted markers are centered between fret wires. The diagram uses equal fret spacing for legibility.

A named scale is derived from a tonic and semitone intervals. Changing its key transposes its pitch set. Custom notes are an explicit pitch-class set; changing their reference root changes interval labels without transposing them. Manual marks always remain at their physical positions.

Named scales receive degree-aware spelling (including E-sharp and B-sharp when necessary), while unrelated chromatic positions use the chosen sharp/flat preference. Written octaves account for enharmonic crossings of the C/B boundary. Interval labels use scale degrees such as 1, ♭3, 4, 5, and ♭7. Named-scale tones use their declared degree spelling; custom or other notes use a chromatic degree label relative to the root.

## Rectangle and stack construction

Source context: https://fretscience.com/tools/scale-visualizer and https://fretscience.com/2022/10/30/the-rectangle-and-the-stack

The public visualizer was inspected through its interactive controls on September 18, 2026, including all five position forms, single shapes, rectangle and stack diagonals, Whole map, Skeleton and Warp. The diagonal checks include clipped fret-edge shapes and outer-string fragments.

The public diagrams informed the geometric interpretation. Our own enumeration and SVG drawing code implements it; no proprietary implementation or lesson assets are copied.

- Rectangle: two adjacent strings, each with two endpoint notes three semitones apart.
- Stack: three adjacent strings, each with two endpoint notes two semitones apart.
- The endpoint notes must all belong to the selected scale's designated pentatonic skeleton.
- When a block crosses G–B, rows on B and high E shift one fret higher to preserve the same fourths-based geometry.
- Major-family scales use the tonic major-pentatonic skeleton. Minor-family scales use the tonic minor-pentatonic skeleton. Added scale notes inside the shape's row ranges are included in its displayed membership and remain visually distinct from skeleton endpoints.
- Pattern construction extends the fourths grid beyond the physical outer strings, validates the full pattern against the pentatonic skeleton, then retains its visible rows. This includes legitimate edge fragments. Explicit focus and pattern-string filters subsequently remove any pattern that no longer fits the user’s selection.
- Position forms are explicit two-note-per-string ranges relative to the minor tonic; major scales use relative-minor geometry. Each form selects its matching blocks from the shared enumeration. Shape mode selects the most complete block of the chosen family within that form.
- Diagonals advance two strings and two frets, adding one fret when crossing G–B. Duplicate suffix chains are removed. Rectangle runs include the next pentatonic tone on each block's upper string. Fret-edge blocks retain their geometry and are clipped by the SVG viewport.
- Left-handed view mirrors outlines and the G–B boundary guide without changing musical identity. Warp visibility never changes note positions. The Skeleton layer links neighboring root positions that are two or three strings apart.
- All patterns displays all enumerated blocks and scale notes across the neck at full strength. Collinear shared red/blue edges receive a two-color stroke so one outline cannot erase the other. Skeleton, Warp, focus and outline filters remain independent.
- Skeleton's exact connection sets were compared with the public reference in all 12 keys at 12, 15, 22 and 24 frets: all 48 matched. Form navigation and Whole map do not change its connections.

## Initial and saved state

Fresh sessions open A minor pentatonic, Form 1, 15 frets, Dots mode, visible string indicators and Warp on. Whole map and Skeleton start off. Reset keeps the key, scale, custom pitches and manual marks. Existing saved custom notes and marks are migrated without being discarded. Named scale pitches are recomputed from the restored tonic rather than trusting a stale pitch array.

Changing forms centers the active range within the horizontally scrolling fretboard. Changing layer or outline visibility leaves the viewport in place. Mobile controls and note palettes wrap without making the page scroll horizontally. Version 4 storage migrates older views and links; the former Skeleton note filter becomes Pentatonic only. Dark mode is a separate device preference.

## Verification

- `npm test`: 37 model tests, including all-pattern visibility and shared rails, exact reference skeleton connections, all five forms across all keys and scale families, diagonal topology, navigation, layers, persistence, and retained music/geometry regressions.
- Guide alignment is checked across all 12 keys, rectangles and stacks, both handedness settings, and tuning-break crossings. The alignment regression fails against the old padded geometry.
- `npm run test:browser`: nine Playwright flows check all-pattern/form/shape/diagonal interactions, map layers, dark mode, legacy migration, mirroring, triads, existing interactions, sharing and containment at 320, 390, and 768 pixels. Browser tests use a separate Chrome context.
- `npm run build`: TypeScript checking and the production Vite bundle.
- Desktop and mobile layouts were visually inspected. Only the fretboard scrolls horizontally.

## Runtime

React and TypeScript with Vite. `src/core/music.ts` owns note and scale theory; `src/core/shapes.ts` enumerates blocks; `src/core/study.ts` composes forms, shapes, diagonals and root connections; `src/core/geometry.ts` provides shared SVG coordinates; `src/core/state.ts` validates, migrates, and updates saved views; `src/core/presentation.ts` determines note visibility and identity. `src/components/` and `src/studio.css` render the studio. Earlier JavaScript implementations remain as legacy reference. Hosting remains local.
