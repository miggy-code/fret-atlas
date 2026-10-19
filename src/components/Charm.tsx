// Each degree keeps one silhouette, so charms stay distinct without color.
const SHAPES: Record<number, string> = {
  2: 'M0,12 L-12,-9 L12,-9 Z',
  3: 'M0,-13 L12,9 L-12,9 Z',
  5: 'M0,-14 L14,0 L0,14 L-14,0 Z',
  6: 'M0,-13 L12.4,-4 L7.6,10.5 L-7.6,10.5 L-12.4,-4 Z',
  7: 'M0,-14 L3.9,-5.3 L13.3,-4.3 L6.3,2 L8.2,11.3 L0,6.6 L-8.2,11.3 L-6.3,2 L-13.3,-4.3 L-3.9,-5.3 Z',
};

export function Charm({ degree }: { degree: number }) {
  if (degree === 4) return <rect className="note-face" x="-10" y="-10" width="20" height="20" />;
  if (SHAPES[degree]) return <path className="note-face" d={SHAPES[degree]} />;
  return <circle className="note-face" r="12" />;
}
