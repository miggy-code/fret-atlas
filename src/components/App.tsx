import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { describeNote, LOWEST_STRING_CHOICES, pitchName, position, scaleById } from '../core/music';
import type { Scale, Tuning } from '../core/music';
import { connectedView, connectOffered, loadState, reducer, restoreState, visibleShapes } from '../core/state';
import type { Action, State } from '../core/state';
import type { SettingsDelta } from '../core/sync-edit';
import { notePresentation } from '../core/presentation';
import { deriveStudy, tuningOf } from '../core/study';
import type { DrillRequest } from '../core/drill';
import { levelOf, practicedForms } from '../core/progress';
import type { Progress } from '../core/progress';
import { BoardLegend } from './BoardLegend';
import { DrillBar, useDrill } from './Drill';
import { ExploreDeck } from './ExploreDeck';
import { Fretboard } from './Fretboard';
import { GuideDialog } from './GuideDialog';
import { MarksPanel } from './MarksPanel';
import { PracticeDeck } from './PracticeDeck';
import { useProgress } from './Progress';
import { SettingsDialog } from './SettingsDialog';
import { FormBar, KeyScalePicker, StudyControls, StudyOptionsBar, StudyPicker } from './StudyControls';
import { ModeTabs } from './ModeTabs';
import { Topbar } from './Topbar';
import { pluck } from './audio';
import { useBoardOrientation } from './useBoardOrientation';
import { useChord } from './useChord';
import { usePlayback } from './usePlayback';
import { useAccountChanges, useDevicePreferences, useSavedView } from './usePreferences';
import { useShare } from './useShare';

export interface AccountView {
  settings: Record<string, unknown>;
  progress: Progress;
  /** Changes whenever something from elsewhere (the account, another tab) should reach the screen. */
  version: number;
  status: string;
  onSettings: (changes: SettingsDelta) => void;
  onProgress: (progress: Progress) => void;
  onClear: () => void;
}

export function App({ accountMenu, account }: { accountMenu?: ReactNode; account?: AccountView }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => account ? restoreState(account.settings.view) : loadState());
  const { darkMode, sound, toggleDarkMode, toggleSound, restore: restorePreferences } = useDevicePreferences(account);
  const { storageWorks, matched } = useSavedView(state, darkMode, sound, account);
  const [mode, setMode] = useState<'explore' | 'practice' | 'drill'>('explore');
  const tab = mode === 'explore' ? 'explore' : 'practice';
  const practicing = mode === 'drill';
  // Practice picks its own degrees (intervals from the root), apart from Explore's isolation, so practicing never changes the map.
  // It lives here because the Practice deck unmounts while a drill runs.
  const [practiceDegrees, setPracticeDegrees] = useState<number[]>([0]);
  // The scale Customize notes started from, kept here because the Explore deck unmounts on the Practice tab.
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [request, setRequest] = useState<DrillRequest>();
  const [connecting, setConnecting] = useState(false);
  const [fitNeck, setFitNeck] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drillContainer = useRef<HTMLDivElement>(null);
  const practiceTrigger = useRef('');
  const guide = useRef<HTMLDialogElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const settings = useRef<HTMLDialogElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const chord = useChord(state, dispatch);
  const { share, manualLink } = useShare(state, notify);
  const orientation = useBoardOrientation();
  const vertical = orientation === 'vertical';
  const scale = scaleById(state.scaleId);
  const tuning = tuningOf(state);
  // Connecting from another view lasts until the next view change, or until the scale no longer offers it.
  if (connecting && !connectOffered(state)) setConnecting(false);
  const viewState = useMemo(() => connectedView(state, connecting), [state, connecting]);
  const { choices, study, ghosts } = useMemo(() => deriveStudy(viewState), [viewState]);
  const shapes = useMemo(() => visibleShapes(viewState, study), [viewState, study]);
  const progress = useProgress(account && { initial: account.progress, onChange: account.onProgress, onClear: account.onClear });
  // Progress tracks the five pentatonic positions, so only Position view counts toward it.
  const family = scale.family;
  const formStudy = family && viewState.studyMode === 'position' ? study : undefined;
  const drill = useDrill(viewState, study, practicing, sound, round => { if (round.kind === 'form' && formStudy) practiced(formStudy.form, state.root); }, request);
  useAccountChanges(account, practicing, (settings, saved) => {
    matched(settings);
    dispatch({ type: 'restore', value: settings.view });
    restorePreferences(settings);
    progress.restore(saved);
  });
  const playback = usePlayback(sound);
  // A drill hides every hint that would give the answer away.
  const boardState = useMemo<State>(() => practicing
    ? { ...viewState, skeleton: false, ghostForms: false, triad: 'off', marks: [], isolatedTones: [], wholeMap: false, context: false }
    : viewState, [viewState, practicing]);

  // The controls that start a drill unmount while it runs, so focus returns to the remounted one by id.
  useEffect(() => {
    if (practicing) { drillContainer.current?.focus(); return; }
    if (!practiceTrigger.current) return;
    (document.getElementById(practiceTrigger.current) ?? guideButton.current)?.focus();
    practiceTrigger.current = '';
  }, [practicing]);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  // Six seconds with a form on screen counts as having seen it.
  useEffect(() => {
    if (!family || !formStudy || practicing) return;
    const timer = setTimeout(() => progress.mark(family, state.root, formStudy.form, 1), 6000);
    return () => clearTimeout(timer);
  }, [family, formStudy?.id, state.root, practicing]);
  // A playing run belongs to the form it started on.
  useEffect(() => { playback.stop(); }, [study?.id]);

  function notify(message: string) {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 3500);
  }
  function practiced(form: number, root: number) {
    if (!family) return;
    progress.mark(family, root, form, 2);
    if (levelOf(progress.progress, family, root, form) < 2 && practicedForms(progress.progress, family, root) === 4) {
      notify(`All five forms of ${pitchName(root, state.spelling)} ${family} practiced`);
    }
  }
  function stopSounds() { playback.stop(); chord.stop(); }
  // With no request, a drill deals random notes along a string or in the active form.
  function startFind(next: DrillRequest | undefined, trigger: string) {
    practiceTrigger.current = trigger;
    stopSounds();
    setInspected(null); setRequest(next); setMode('drill');
  }
  function endPractice() {
    stopSounds();
    setRequest(undefined); setMode('practice');
  }
  function chooseTab(next: 'explore' | 'practice') {
    if (practicing) { practiceTrigger.current = ''; endPractice(); }
    stopSounds();
    setMode(next);
  }
  function hearChord() {
    stopSounds();
    if (!sound) { notify('Sound is off. Turn it on in Settings.'); return; }
    chord.play();
  }
  function toggleConnections() {
    if (connecting) setConnecting(false);
    else if (state.studyMode === 'position') dispatch({ type: 'toggle', key: 'ghostForms' });
    else setConnecting(true);
  }
  function studyDispatch(action: Action) {
    if (action.type === 'study-mode') setConnecting(false);
    dispatch(action);
  }
  function markNote(id: string) {
    dispatch({ type: 'mark', id });
    if (sound) pluck(position(...(id.split(':').map(Number) as [number, number]), tuning).midi);
  }
  // A form plays the way it is fingered: low string to high, each string left to right.
  // Listening is part of Explore; only a play-through from Practice counts toward progress.
  function playForm(credit = false) {
    if (playback.running) { playback.stop(); return; }
    const notes = [6, 5, 4, 3, 2, 1]
      .flatMap(string => Array.from({ length: state.frets + 1 }, (_, fret) => position(string, fret, tuning)))
      .filter(note => { const p = notePresentation(note, viewState, shapes, study, ghosts); return p.active && p.visible; });
    const form = formStudy?.form, root = state.root;
    playback.play(notes, credit && form ? () => practiced(form, root) : undefined);
  }

  const tuningLabel = state.fourths ? 'All fourths'
    : state.lowest === 0 ? 'Standard tuning'
    : `Tuned ${LOWEST_STRING_CHOICES.find(c => c.lowered === state.lowest)?.label} lowest`;
  const showPatternNotice = !practicing && scale.family && !['string', 'nps'].includes(state.studyMode) && state.patterns.length > 0 && !shapes.length;

  const studyProps = {
    state: viewState, dispatch: studyDispatch, scale, study, choiceCount: choices.length,
    formLevel: family && tab === 'practice' ? (form: number) => levelOf(progress.progress, family, state.root, form) : undefined,
    playing: playback.running, onPlay: tab === 'explore' ? () => playForm() : undefined,
    connected: viewState.studyMode === 'position' && viewState.ghostForms, onConnect: toggleConnections,
  };
  const patternNotice = showPatternNotice && <div className="board-notice" role="status">No patterns fit the current strings and fret range. The notes are still shown.</div>;
  const drillDeck = practicing && <div id="deck" role="tabpanel" aria-labelledby="practice-tab" ref={drillContainer} tabIndex={-1}>
    <DrillBar session={drill} onEnd={endPractice} />
  </div>;
  const board = <Fretboard state={boardState} shapes={practicing ? [] : shapes} study={study} ghosts={ghosts} fitNeck={fitNeck} drill={drill.view} playing={playback.playing}
    onMark={practicing ? drill.tap : markNote} onInspect={practicing ? () => {} : setInspected}>
    {/* What is on the board and what the pointer is on read together, right under the neck. */}
    {!practicing && <div className="board-footer">
      <BoardLegend state={viewState} shapes={shapes} scale={scale} />
      <NoteInspector inspected={inspected} state={state} tuning={tuning} scale={scale} />
    </div>}
  </Fretboard>;
  const deck = !practicing && <div id="deck" role="tabpanel" aria-labelledby={`${tab}-tab`}>
    {tab === 'practice'
      ? <PracticeDeck state={viewState} dispatch={dispatch} scale={scale} study={study} family={family} progress={progress.progress}
        onClearProgress={progress.clear} synced={!!account} chord={{ root: chord.root, kind: chord.kind }} onChord={chord.change}
        degrees={practiceDegrees} onDegrees={setPracticeDegrees} playing={playback.running}
        onFindNotes={() => startFind(undefined, 'find-notes')} onFind={startFind} onPlayThrough={() => playForm(true)} />
      : <ExploreDeck state={viewState} dispatch={dispatch} scale={scale} customFrom={customFrom} onCustomize={setCustomFrom} chord={{
        kind: chord.kind, root: chord.root, shown: chord.shown, onChange: chord.change, onToggle: chord.toggle, onHear: hearChord,
      }} />}
  </div>;
  const tabs = <ModeTabs tab={tab} onChoose={chooseTab} />;

  return <>
    <main className="workspace" data-orientation={orientation}>
      <Topbar accountMenu={accountMenu} onShare={share} guideButton={guideButton} settingsButton={settingsButton}
        onGuide={() => guide.current?.showModal()} onSettings={() => settings.current?.showModal()} />
      <section className="board-card" aria-label="Interactive fretboard">
        <div className="board-heading">
          {/* Key and scale are the heading: the selects name the study, so the h1 is only shown where they are not (a drill). */}
          <div className="board-title">
            <h1 className={practicing ? undefined : 'sr-only'}><span className="tonic-badge">{pitchName(state.root, state.spelling)}</span> {scale.name}</h1>
            {!practicing && !vertical && <KeyScalePicker state={viewState} dispatch={studyDispatch} />}
            <p>{tuningLabel} <span>·</span> High strings above <span>·</span> Nut {state.leftHanded ? 'right' : 'left'}</p>
          </div>
          {!vertical && tabs}
        </div>
        {vertical
          // A phone reads top to bottom: pick key, scale and view, then the form attached to the board, then the board,
          // then everything secondary. The form bar (or the drill prompt) sticks while a long neck scrolls under it.
          ? <>
            {!practicing && <section className="study-controls" aria-label="Study controls"><StudyPicker {...studyProps} /></section>}
            {patternNotice}
            <div className="board-stage">
              {practicing ? drillDeck : <FormBar {...studyProps} />}
              {board}
            </div>
            {!practicing && <StudyOptionsBar {...studyProps} />}
            {tabs}
            {deck}
          </>
          : <>
            {!practicing && <StudyControls {...studyProps} />}
            {patternNotice}
            {drillDeck}
            {(state.studyMode === 'diagonal' || state.studyMode === 'all')
              && <button className={`fit-neck ${state.frets > 17 ? 'long-neck' : ''}`} type="button" aria-pressed={fitNeck} onClick={() => setFitNeck(value => !value)}>Fit neck to screen</button>}
            {board}
            {deck}
          </>}
      </section>
      <MarksPanel state={state} dispatch={dispatch} scale={scale} tuning={tuning} />
      {manualLink && <label className="manual-link">View link<input readOnly value={manualLink} onFocus={e => e.target.select()} /></label>}
      <footer className="page-footer">
        <span role="status">{account ? account.status : storageWorks ? 'Saved on this device' : 'Storage unavailable · use Share view'}</span>
      </footer>
    </main>
    {notice && <div className="toast" role="status">{notice}</div>}
    <GuideDialog dialog={guide} onClose={() => guideButton.current?.focus()} />
    <SettingsDialog dialog={settings} onClose={() => settingsButton.current?.focus()} state={state} dispatch={dispatch}
      darkMode={darkMode} onDarkMode={toggleDarkMode} sound={sound} onSound={toggleSound} />
  </>;
}

type InspectorProps = { inspected: string | null; state: State; tuning: Tuning; scale: Scale };

/** Names the note under the pointer (or the last one tapped), and says how to mark one while nothing is chosen. */
function NoteInspector({ inspected, state, tuning, scale }: InspectorProps) {
  const [string, fret] = inspected ? inspected.split(':').map(Number) : [];
  const note = inspected ? describeNote(position(string, fret, tuning), state.root, scale, state.spelling) : undefined;
  return <div className="note-inspector" role="status" aria-live="polite">{note
    ? <>
      <strong>{note.name}<small>{note.octave}</small></strong><span>Degree {note.interval}</span><span>String {string} · {fret === 0 ? 'Open' : `Fret ${fret}`}</span>
      {state.marks.includes(inspected!) && <em>Marked</em>}
    </>
    : <>
      <span className="pointer-hint">Hover a note for its name. Click to mark it.</span>
      <span className="touch-hint">Tap a note to mark it.</span>
      <span className="keyboard-hint"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> move <span>·</span> <kbd>enter</kbd> mark</span>
    </>}</div>;
}
