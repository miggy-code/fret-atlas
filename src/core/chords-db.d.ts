// The part of chords-db's guitar data read here. Frets count from `baseFret` (1 = baseFret); -1 is a muted string.
declare module '@tombatossals/chords-db/lib/guitar.json' {
  const guitar: {
    chords: Record<string, { key: string; suffix: string; positions: { frets: number[]; fingers: number[]; baseFret: number; barres: number[]; capo?: boolean; midi: number[] }[] }[]>;
  };
  export default guitar;
}
