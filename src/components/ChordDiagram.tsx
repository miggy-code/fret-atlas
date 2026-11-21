import type { Grip } from '../core/chord-shapes';

const ROWS = 4, GAP = 15, ROW = 18, SIDE = 12, TOP = 18, LABEL = 22;

/**
 * A grip as a chord book draws it: strings standing up, low E on the left (on the right for a left-handed player), the nut
 * or the first fret's number at the top, a dot and finger number per fretted string, the barre, and o or × above the rest.
 */
export function ChordDiagram({ symbol, grip, leftHanded }: { symbol: string; grip: Grip; leftHanded: boolean }) {
  const fretted = grip.notes.filter(n => n.fret > 0);
  const frets = fretted.map(n => n.fret);
  const first = frets.length && Math.max(...frets) > ROWS ? Math.min(...frets) : 1;
  const strings = leftHanded ? [1, 2, 3, 4, 5, 6] : [6, 5, 4, 3, 2, 1];
  const x = (string: number) => SIDE + strings.indexOf(string) * GAP;
  const y = (fret: number) => TOP + (fret - first + .5) * ROW;
  const right = SIDE + 5 * GAP;
  const chart = [6, 5, 4, 3, 2, 1].map(s => grip.notes.find(n => n.string === s));
  const label = `${symbol} grip${grip.shape ? `, ${grip.shape} shape` : ''}${grip.barre ? `, barre at fret ${grip.barre.fret}` : ''}: `
    + `${chart.map(n => n?.fret ?? 'x').join(' ')}, fingers ${chart.map(n => n?.finger ?? 'x').join(' ')}`;
  return <figure className="chord-diagram">
    <svg role="img" aria-label={label} viewBox={`0 0 ${right + LABEL} ${TOP + ROWS * ROW + 4}`} width={right + LABEL} height={TOP + ROWS * ROW + 4}>
      {first === 1 && <line className="chord-nut" x1={SIDE} x2={right} y1={TOP} y2={TOP} />}
      {Array.from({ length: ROWS + 1 }, (_, i) => <line key={i} className="chord-fret" x1={SIDE} x2={right} y1={TOP + i * ROW} y2={TOP + i * ROW} />)}
      {strings.map(s => <line key={s} className="chord-string" x1={x(s)} x2={x(s)} y1={TOP} y2={TOP + ROWS * ROW} />)}
      {first > 1 && <text className="chord-first" x={right + 10} y={y(first)} dominantBaseline="central">{first}</text>}
      {grip.muted.map(s => <text key={s} className="chord-mute" x={x(s)} y={TOP - 7} textAnchor="middle" dominantBaseline="central">×</text>)}
      {grip.notes.filter(n => n.fret === 0).map(n => <circle key={n.string} className="chord-open" cx={x(n.string)} cy={TOP - 7} r="3.5" />)}
      {grip.barre && <rect className="chord-barre" x={Math.min(x(grip.barre.from), x(grip.barre.to)) - 6.5} y={y(grip.barre.fret) - 6.5}
        width={Math.abs(x(grip.barre.from) - x(grip.barre.to)) + 13} height="13" rx="6.5" />}
      {fretted.map(n => <g key={n.string} transform={`translate(${x(n.string)},${y(n.fret)})`}>
        <circle className="chord-dot" r="6.5" />
        <text className="chord-finger" textAnchor="middle" dominantBaseline="central">{n.finger}</text>
      </g>)}
    </svg>
    <figcaption><strong>{symbol}</strong>
      <span>{[grip.shape ? `${grip.shape} shape` : first > 1 ? `from fret ${first}` : 'open position', grip.inversion && 'not on its root', grip.rating === 'hard' && 'harder grip'].filter(Boolean).join(' · ')}</span>
    </figcaption>
  </figure>;
}
