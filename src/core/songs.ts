import type { Song } from './song';

// Traditional melodies, each copied verbatim from the ABC page named in `source`. Only the sung tune is used, never a
// later recorded arrangement. Fingering is not stored: `songPath` works it out from the forms.
export const SONGS: readonly Song[] = [
  {
    id: 'house-of-the-rising-sun',
    title: 'House of the Rising Sun',
    source: 'https://abcnotation.com/tunePage?a=trillian.mit.edu/~jc/music/abc/mirror/musicaviva.com/tunes/usa/house-of-the-rising-01/0000',
    provenance: 'Traditional (USA, anonymous). Transcribed by Frank Nordberg for Musica Viva. The traditional sung melody, not the Animals\' 1964 arrangement.',
    abc: `X:417
T:House of the Rising Sun
C:anon.
O:USA
Z:Transcribed by Frank Nordberg - http://www.musicaviva.com
F:http://abc.musicaviva.com/tunes/usa/house-of-the-rising-01.abc
M:3/4
L:1/4
Q:1/4=144
K:Dm
A|"Dm"D2 (E/D/)|"Dm"F2 (G/^G/)|"A7"A2 (F/E/)|"Dm"D2A|
w:There is a* house in* New Or-* leans, they
"Dm"d2A|"C7"c2 (A/G/)|"F"A3-|"A7"Az A/A/|
w:call the ris- ing* sun.* And it's
"Dm"d2D|"Dm"F2G|"Dm"A<A (F/E/)|"Bb7"D2A|
w:been the ruin of man- y poor* boy, and
"Dm"A2A|"A7"(A<A,) (F/E/)|"Dm"D3-|"Dm"D2|]
w:Lord, I know* I'm* one.*`,
  },
  {
    id: 'scarborough-fair',
    title: 'Scarborough Fair',
    source: 'https://abcnotation.com/tunePage?a=pghardy.net/tunebooks/pgh_songs_tunebook/0031',
    provenance: 'Traditional (England). From Paul Hardy\'s Songs Tunebook 2025, whose transcription is licensed CC BY-NC-SA. The traditional ballad tune, not the Simon & Garfunkel arrangement.',
    abc: `X:19901
T:Scarborough Fair
R:Waltz
C:Trad.
O:England
Z:Paul Hardy's Songs Tunebook 2025 (see www.pghardy.net). Creative Commons CC BY-NC-SA licenced.
M:3/4
L:1/8
Q:1/4=120
K:Ddor
"Dm"D4D2|A4A2|"C"E3FE2|"Dm"D6-|D2 A2c2|d4c2|"G"A2B2G2|"Dm"A6-|A4d2|
d4d2|"F"c4A2|A2G2F2|"C"E2C4-|C6|"Dm"D4A2|"C"G4"F"F2|"C"E2D2C2|"Dm"D6-|D6:|]`,
  },
  {
    id: 'blackwaterside',
    title: 'Blackwaterside',
    source: 'https://abcnotation.com/tunePage?a=sniff.numachi.com/~rickheit/dtrad/abc_dtrad.tar.gz/abc_dtrad/BLKWTRSD/0000',
    provenance: 'Traditional (Irish/British, Roud 564). Digital Tradition entry, converted to ABC automatically, so rhythms are approximate. The ballad tune, not Bert Jansch\'s or Jimmy Page\'s guitar arrangement.',
    abc: `% Generated more or less automatically by swtoabc by Erich Rickheit KSC
X:1
T:Blackwaterside
M:3/4
L:1/2
K:A
 C/2| C/4- E3/4 F/2| A3/2-| A A/4B/4| d c/2| B3/2-| B/2 B| A3/2-| A3/4- G/4 A/2|\\
 =G3/2| A3/2| E3/2-| E z/2| C E/2| F3/4- ^E/4 F/2| A C/2| D3/2-| D3/4- C/4- D/2|\\
 E3/2-| E B,/4C/4| D3/2-| D3/4- C/4 B,/2| A,3/2-| A, A,/2| A,3/2-|\\
 A,||`,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    source: 'https://abcnotation.com/tunePage?a=colinhume.com/ABC.txt/0030',
    provenance: 'Traditional hymn tune "New Britain" (USA), in print since about 1830. From Colin Hume\'s website, which credits Carrell and Clayton, 1831.',
    // The page writes no key signature, but the tune is in G: it ends on G and its chords are G, C and D7.
    key: 'G',
    abc: `X:31
T:Amazing Grace
C:'New Britain': James P. Carrell and David L. Clayton, 1831
S:Colin Hume's website,  colinhume.com  - chords can also be printed below the stave.
Q:1/4=112
R:Waltz
%%MIDI chordprog 19     % Church Organ
%%MIDI bassprog 58      % Tuba
%%MIDI program 60       % French Horn
M:3/4
%%MIDI beat 100 95 80
L:1/4
K:C
D | [I: MIDI=gchord b2b] "G"G2B/G/ | "G7"B2A | "C"G2 E | "G"D2 "D7"D | "G"G2 B/G/ | "Em"B2A | "D"d3- | d2B |
"G"d2 B/G/ | "G7"B2A | "C"G2E | "G"D2 "D7"D | "Em"G2B/G/ | "D7"B2A | "G"G3- | G2 |]`,
  },
  {
    id: 'wayfaring-stranger',
    title: 'Wayfaring Stranger',
    source: 'https://abcnotation.com/tunePage?a=www.nigelgatherer.com/tunes/abc/tb12/0034',
    provenance: 'Traditional (USA, spiritual). Transcribed by Nigel Gatherer from John Garst. The page gives the melody without chords.',
    abc: `X:585
T:I Am a Poor, Wayfaring Stranger
S:John Garst
Z:Nigel Gatherer
L:1/8
M:3/4
K:Dm
DDA | A3 GAG | F D2
DDA | G3 FDC | D3
AAc | d3 Acd | A G2
AAc | d3 Acc | A3
DDA | A3 GAG | F D2
DDA | G3 FDC | D3 |]`,
  },
];

export const songById = (id: string) => SONGS.find(song => song.id === id);
