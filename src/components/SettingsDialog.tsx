import type { Dispatch, RefObject } from 'react';
import { LOWEST_STRING_CHOICES } from '../core/music';
import { sectionModified } from '../core/state';
import type { Action, State } from '../core/state';
import { Icon, RestoreButton, Toggle } from './controls';

interface SettingsProps {
  dialog: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  state: State;
  dispatch: Dispatch<Action>;
  darkMode: boolean;
  onDarkMode: () => void;
  sound: boolean;
  onSound: () => void;
}

/** Device and instrument settings: chosen once, so they live outside the Explore and Practice tabs. */
export function SettingsDialog({ dialog, onClose, state, dispatch, darkMode, onDarkMode, sound, onSound }: SettingsProps) {
  const close = () => dialog.current?.close();
  const toggle = (key: 'fourths' | 'stringNames' | 'leftHanded') => () => dispatch({ type: 'toggle', key });
  return <dialog ref={dialog} className="guide-dialog settings-dialog" aria-labelledby="settings-title" onClose={onClose}
    onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="guide-content">
      <div className="dialog-heading">
        <h2 id="settings-title">Settings</h2>
        <button className="icon-button" aria-label="Close settings" onClick={close}><Icon name="close" /></button>
      </div>
      <section className="settings-section" aria-label="Instrument and display">
        <div className="instrument-settings">
          <label className="field"><span>Frets</span>
            <select id="frets" value={state.frets} onChange={e => dispatch({ type: 'frets', value: Number(e.target.value) })}>
              {[12, 15, 17, 22, 24].map(f => <option key={f} value={f}>{f} frets</option>)}
            </select>
          </label>
          <label className="field"><span>Lowest string</span>
            <select id="lowest" value={state.lowest} onChange={e => dispatch({ type: 'lowest', value: Number(e.target.value) })}>
              {LOWEST_STRING_CHOICES.map(c => <option key={c.lowered} value={c.lowered}>{c.label}</option>)}
            </select>
          </label>
          <Toggle label="All fourths" checked={state.fourths} onChange={toggle('fourths')}
            hint="Tune the B and e strings up a semitone so every string is a fourth apart" />
          <label className="field"><span>Key spelling</span>
            <select id="spelling" value={state.spelling} onChange={e => dispatch({ type: 'spelling', value: e.target.value as 'sharps' | 'flats' })}>
              <option value="sharps">Sharps ♯</option><option value="flats">Flats ♭</option>
            </select>
          </label>
          <Toggle label="Dark mode" checked={darkMode} onChange={onDarkMode} />
          <Toggle label="Sound" checked={sound} onChange={onSound} hint="Pluck notes when you tap them, play forms and hear drill feedback" />
          <Toggle label="String names" checked={state.stringNames} onChange={toggle('stringNames')} />
          <Toggle label="Left-handed" checked={state.leftHanded} onChange={toggle('leftHanded')} />
        </div>
        {sectionModified(state, 'instrument')
          && <RestoreButton label="Instrument & display" onClick={() => dispatch({ type: 'reset-section', value: 'instrument' })} />}
      </section>
      <section className="settings-section" aria-label="Reset">
        <p>Restore display settings to their defaults. Tuning, key, scale and marked notes stay.</p>
        <button className="text-button reset-view" onClick={() => dispatch({ type: 'reset-view' })}><Icon name="undo" /><span>Reset view</span></button>
      </section>
    </div>
  </dialog>;
}
