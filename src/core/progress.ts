// Which pentatonic forms have been studied, per key and scale family. A device record, kept out of the shared view.
export type Family = 'minor' | 'major';
export type Level = 1 | 2; // 1: seen, 2: practiced (played through or drilled)
export type Progress = Record<string, Level>;
export const FORMS = [1, 2, 3, 4, 5] as const;

export const progressKey = (family: Family, root: number, form: number) => `${family}:${root}:${form}`;
export const levelOf = (p: Progress, family: Family, root: number, form: number) => p[progressKey(family, root, form)] ?? 0;

/** Raises a form's level; never lowers it. Returns the same object when nothing changes. */
export function record(p: Progress, family: Family, root: number, form: number, level: Level): Progress {
  const key = progressKey(family, root, form);
  return (p[key] ?? 0) >= level ? p : { ...p, [key]: level };
}

export const practicedForms = (p: Progress, family: Family, root: number) => FORMS.filter(form => levelOf(p, family, root, form) === 2).length;
export const practicedTotal = (p: Progress, family: Family) => Object.entries(p).filter(([key, level]) => key.startsWith(`${family}:`) && level === 2).length;

export function restoreProgress(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).filter(([key, level]) => /^(minor|major):([0-9]|1[01]):[1-5]$/.test(key) && (level === 1 || level === 2))) as Progress;
}
