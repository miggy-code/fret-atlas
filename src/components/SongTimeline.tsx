import { useEffect, useRef } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { romanNumeral } from '../core/harmony';
import { mod, scaleById, toneAt } from '../core/music';
import type { Transition } from '../core/song';
import type { Songs } from './Songs';

const CHANGES: Record<Transition, { label: string; hint: string }> = {
  pivot: { label: 'Pivot', hint: 'Change form on a note both forms share' },
  slide: { label: 'Slide', hint: 'Slide along the string into the next form' },
  shift: { label: 'Shift', hint: 'Move the hand to the next form' },
};

/**
 * The song on one time axis: its phrases, the chord under each stretch, the form the hand is in, and the melody's
 * contour. Everything lines up, so a chord change, a form change and the notes around them read together.
 */
export function SongTimeline({ songs }: { songs: Songs }) {
  const { path, phrases, note, segment, phrase, chord, cursor } = songs;
  const scroller = useRef<HTMLDivElement>(null);
  // A long song scrolls inside the strip; the playhead is kept in sight as it moves.
  useEffect(() => {
    const el = scroller.current, track = el?.querySelector<HTMLElement>('.lane-track');
    if (!el || !track || !path || !note || el.scrollWidth <= el.clientWidth) return;
    const x = track.offsetLeft + track.offsetWidth * note.start / path.length;
    if (x < el.scrollLeft + track.offsetLeft + 24 || x > el.scrollLeft + el.clientWidth - 48) el.scrollLeft = x - el.clientWidth / 3;
  }, [cursor, path]);
  if (!path || !note || !segment) return null;

  const scale = scaleById(path.scaleId);
  const span = (start: number, beats: number): CSSProperties => ({ left: `${start / path.length * 100}%`, width: `${beats / path.length * 100}%` });
  const pitches = path.notes.map(n => n.midi);
  const low = Math.min(...pitches), range = Math.max(1, Math.max(...pitches) - low);
  const kindOf = (index: number) => {
    const n = path.notes[index];
    if (n.chord !== null && path.chords[n.chord].chord.tones.some(t => t.pitch === mod(n.midi))) return 'chord';
    return toneAt(scale, path.root, n.midi) ? 'scale' : 'outside';
  };
  const changes = path.segments.filter(s => s.change).map(s => CHANGES[s.change!].label.toLowerCase());
  const route = path.segments.length === 1 ? `Stays in ${segment.study.label} the whole way`
    : `${path.segments.length} stretches, ${changes.length} ${changes.length === 1 ? 'move' : 'moves'}: ${changes.join(', ')}`;
  function seek(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const beat = (event.clientX - box.left) / box.width * path!.length;
    songs.go((path!.notes.filter(n => n.start <= beat).at(-1) ?? path!.notes[0]).index);
  }

  return <section className="song-timeline" aria-label="The song in time">
    <h3>The song in time <span>{route}</span></h3>
    <div ref={scroller} className="song-lanes-scroll">
      <div className="song-lanes" style={{ '--bars': path.bars.length } as CSSProperties}>
        <span className="lane-label">Phrases</span>
        <ol className="lane-track lane-phrases" aria-label="Phrases">{phrases.map(p => <li key={p.index} style={span(p.start, p.beats)}>
          <button type="button" className={p.index === phrase?.index ? 'is-current' : ''} aria-current={p.index === phrase?.index ? 'step' : undefined}
            aria-label={`Phrase ${p.index + 1}, notes ${p.from + 1} to ${p.to + 1}${songs.clean.includes(p.index) ? ', played back clean' : ''}`} onClick={() => songs.go(p.from)}>
            <strong>{p.index + 1}</strong>{songs.clean.includes(p.index) && <small className="phrase-clean" aria-hidden="true">✓</small>}
          </button>
        </li>)}</ol>

        <span className="lane-label">Chords</span>
        {path.chords.length
          ? <ol className="lane-track lane-chords" aria-label="Chords">{path.chords.map(c => <li key={c.index} style={span(c.start, c.beats)}>
            <button type="button" className={c.index === chord?.index ? 'is-current' : ''} aria-current={c.index === chord?.index ? 'step' : undefined}
              title={`${c.chord.symbol}: ${c.chord.tones.map(t => t.label).join(' ')}`}
              onClick={() => songs.go((path.notes.find(n => n.chord === c.index) ?? path.notes.find(n => n.start >= c.start) ?? path.notes[path.notes.length - 1]).index)}>
              <strong>{c.chord.symbol}</strong><small>{romanNumeral(c.chord, path.root)}</small>
            </button>
          </li>)}</ol>
          : <p className="lane-track lane-none">This page gives the melody without chords.</p>}

        <span className="lane-label">Forms</span>
        <ol className="lane-track lane-forms song-route" aria-label="Route through the forms">{path.segments.map(s => <li key={s.index} style={span(s.start, (path.segments[s.index + 1]?.start ?? path.length) - s.start)}>
          <button type="button" className={s.index === segment.index ? 'is-current' : ''} aria-current={s.index === segment.index ? 'step' : undefined}
            title={`Notes ${s.from + 1}–${s.to + 1}, from fret ${s.study.anchor}`} onClick={() => songs.go(s.from)}>
            {s.change && <span className={`route-change is-${s.change}`} title={CHANGES[s.change].hint}>{CHANGES[s.change].label}</span>}
            <strong>{s.study.label}</strong><small>fret {s.study.anchor}</small>
          </button>
        </li>)}</ol>

        <span className="lane-label">Melody</span>
        {/* The contour is a picture of the notes; the lanes above and the step buttons do its job for the keyboard. */}
        <div className="lane-track lane-melody" aria-hidden="true" onClick={seek}>
          {path.notes.map(n => <i key={n.index} className={`is-${kindOf(n.index)} ${n.index === note.index ? 'is-current' : ''}`}
            style={{ ...span(n.start, n.beats), '--height': (n.midi - low) / range } as CSSProperties} />)}
        </div>

        <div className="lane-bars" aria-hidden="true">{path.bars.slice(1).map(bar => <i key={bar} style={{ left: `${bar / path.length * 100}%` }} />)}</div>
        <div className="lane-playhead" aria-hidden="true"><i style={{ left: `${note.start / path.length * 100}%` }} /></div>
      </div>
    </div>
    <p className="lane-legend">
      {path.chords.length > 0 && <span><i className="is-chord" />On a chord tone</span>}
      <span><i className="is-scale" />{path.chords.length ? 'Scale tone passing over the chord' : 'Scale tone'}</span>
      {path.notes.some(n => kindOf(n.index) === 'outside') && <span><i className="is-outside" />Outside the scale</span>}
    </p>
  </section>;
}
