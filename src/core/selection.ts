import { mod, scaleById } from './music';

type PitchSelection = { root: number; scaleId: string; customPitches: number[] };

export const selectedPitches = (s: PitchSelection) => s.scaleId === 'custom' ? s.customPitches : scaleById(s.scaleId).tones.map(t => mod(s.root + t.semitones));
