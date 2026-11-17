import type { CSSProperties } from 'react';
import { pitchName, scaleById, spellTone } from '../core/music';
import type { Spelling } from '../core/music';
import { degreeColor } from '../core/presentation';
import type { SongPath } from '../core/song';
import type { Insight } from '../core/song-insight';

const percent = (share: number) => `${Math.round(share * 100)}%`;
const listed = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** What the numbers say, in sentences a player can act on. */
function findings(insight: Insight, path: SongPath, spelling: Spelling) {
  const key = pitchName(path.root, spelling);
  const lines: string[] = [];
  const used = insight.degrees.filter(d => d.count > 0);
  if (insight.pentatonic) {
    const whole = insight.pentatonic.share > .999;
    lines.push(whole
      ? `Every note is in ${key} ${insight.pentatonic.family} pentatonic: the five forms already hold this whole melody.`
      : `${percent(insight.pentatonic.share)} of the melody is ${key} ${insight.pentatonic.family} pentatonic, the notes the five forms are built on.`);
    const added = used.filter(d => d.kind === 'added').map(d => d.label);
    if (added.length) lines.push(`The scale adds ${listed(added)}, drawn dashed around the form.`);
  }
  const outside = used.filter(d => d.kind === 'outside').map(d => d.label);
  if (outside.length) lines.push(`${listed(outside)} ${outside.length === 1 ? 'comes' : 'come'} from outside the scale, as a passing color.`);
  const leaning = [...used].sort((a, b) => b.share - a.share).slice(0, 2).map(d => d.label);
  if (leaning.length === 2) lines.push(`It rests mostly on ${leaning[0]} and ${leaning[1]}.`);
  if (insight.chordTones) lines.push(insight.chordTones.share > .999
    ? 'Every note is a tone of the chord under it.'
    : `${percent(insight.chordTones.share)} of the time the melody is on a tone of the chord under it; the rest passes between chord tones.`);
  for (const use of insight.chords) {
    const borrowed = use.degrees.filter(d => !d.inScale);
    if (borrowed.length) lines.push(`${use.chord.symbol} brings in ${listed(borrowed.map(d => `${d.label} (${spellTone(path.root, spelling, d.tone).name})`))}, which the scale does not have.`);
  }
  return lines;
}

/** What the melody is made of: time on each degree, what that means for the forms, and how each chord is built from the key. */
export function SongInsights({ insight, path, spelling, onSeek }: { insight: Insight; path: SongPath; spelling: Spelling; onSeek: (index: number) => void }) {
  const scale = scaleById(path.scaleId);
  const top = Math.max(...insight.degrees.map(d => d.share), .0001);
  return <section className="song-insights" aria-label="In this melody">
    <h3>In this melody <span>{pitchName(path.root, spelling)} {scale.name}</span></h3>
    <div className="insight-grid">
      <figure className="degree-bars">
        <ol aria-label="Time on each scale degree">{insight.degrees.map(d => <li key={d.semitones} className={`is-${d.kind} ${d.count ? '' : 'is-unused'}`}
          style={{ '--share': d.share / top, ...(d.degree ? { '--chip': degreeColor(d.degree) } : {}) } as CSSProperties}
          title={`${d.label}: ${d.count} ${d.count === 1 ? 'note' : 'notes'}`}>
          <span>{d.count ? percent(d.share) : '–'}</span><i aria-hidden="true" /><strong>{d.label}</strong>
        </li>)}</ol>
        <figcaption>Share of the melody's time on each degree of the key.</figcaption>
      </figure>
      <ul className="insight-lines">{findings(insight, path, spelling).map(line => <li key={line}>{line}</li>)}</ul>
      {insight.chords.length > 0 && <table className="chord-table">
        <caption>Each chord, built from degrees of the key</caption>
        <thead><tr><th scope="col">Chord</th><th scope="col">In the key</th><th scope="col">Its tones</th><th scope="col">Time</th></tr></thead>
        <tbody>{insight.chords.map(use => <tr key={use.chord.symbol}>
          <th scope="row"><button type="button" disabled={use.first < 0} onClick={() => onSeek(use.first)} title="Go to this chord">{use.chord.symbol}</button></th>
          <td className="chord-roman">{use.roman}</td>
          <td><span className="chord-degrees">{use.degrees.map(d => <em key={d.pitch} className={`degree-chip ${!d.inScale ? 'is-outside' : d.tone.semitones === 0 ? 'is-root' : d.tone.skeleton ? 'is-skeleton' : 'is-added'}`} style={{ '--chip': degreeColor(d.tone.degree) } as CSSProperties} title={`${spellTone(path.root, spelling, d.tone).name}${d.inScale ? '' : ', outside the scale'}`}>{d.label}</em>)}</span></td>
          <td className="chord-share">{percent(use.share)}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </section>;
}
