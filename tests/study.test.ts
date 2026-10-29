import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, reducer, restoreState, visibleShapes } from '../src/core/state';
import { activeStudy, deriveStudy, ghostStudies, rootConnections, studyChoices } from '../src/core/study';
import { mod, position, SCALES } from '../src/core/music';
import { notePresentation } from '../src/core/presentation';
import { boardGeometry, sharedShapePath } from '../src/core/geometry';

test('all patterns shows the whole scale and retains both colors on shared rails',()=>{
  const s=reducer(defaultState(),{type:'study-mode',value:'all'});
  assert.equal(activeStudy(s)!.label,'Whole neck');
  assert.ok(visibleShapes(s).filter(shape=>shape.kind==='rectangle').length>2);
  assert.ok(visibleShapes(s).filter(shape=>shape.kind==='stack').length>1);
  for(let string=1;string<=6;string++) for(let fret=0;fret<=s.frets;fret++) {
    const note=notePresentation(position(string,fret),s);
    assert.equal(note.visible,note.selected);
    assert.equal(note.background,false);
  }
  const rails=sharedShapePath(visibleShapes(s),boardGeometry(s.frets,false));
  assert.ok(rails.length>0);
  assert.equal(sharedShapePath(visibleShapes(defaultState()),boardGeometry(s.frets,false)),'');
  assert.equal(sharedShapePath(visibleShapes({...s,patterns:['rectangle']}),boardGeometry(s.frets,false)),'');
  assert.equal(restoreState(JSON.parse(JSON.stringify(s))).studyMode,'all');
});

test('A skeleton exactly matches the eight observed reference connections regardless of form or map layer',()=>{
  const expected=['5:0>3:2','3:2>1:5','3:2>6:5','1:5>4:7','6:5>4:7','4:7>2:10','2:10>5:12','5:12>3:14'].sort();
  for(const studyMode of ['position','shape','diagonal','all'] as const) for(const wholeMap of [false,true]) {
    const s={...{ ...defaultState(), frets: 15 },studyMode,wholeMap,form:3};
    assert.deepEqual(rootConnections(s).map(({a,b})=>`${a.id}>${b.id}`).sort(),expected);
  }
});

test('all five forms transpose to valid pentatonic endpoints in every key and scale family',()=>{
  for(const scale of SCALES.filter(s=>s.family)) for(let root=0;root<12;root++) {
    const s={...defaultState(),root,scaleId:scale.id,frets:24};
    const choices=studyChoices(s);
    assert.equal(new Set(choices.map(c=>c.form)).size,5);
    const pitches=scale.tones.filter(t=>t.skeleton).map(t=>mod(root+t.semitones));
    for(const c of choices) {
      assert.equal(c.rows.length,6);
      for(const row of c.rows) for(const fret of [row.left,row.right].filter(f=>f<=24)) {
        assert.ok(pitches.includes(position(row.string,fret).pitch),`${scale.id} / ${root} / ${c.id}`);
      }
      // Each string belongs to exactly one block within a position; no overpainted edges.
      for(let string=1;string<=6;string++) assert.ok(c.shapes.filter(shape=>shape.rows.some(r=>r.string===string)).length<=1);
    }
  }
});

test('form navigation follows fret order, wraps and survives saved views',()=>{
  let s=defaultState();
  const start=activeStudy(s)!.id;
  assert.equal(start,'1:5');
  const seen=new Set<string>();
  for(let i=0;i<studyChoices(s).length;i++) {
    seen.add(activeStudy(s)!.id);
    s=reducer(s,{type:'study-step',direction:1});
    assert.deepEqual(activeStudy(restoreState(JSON.parse(JSON.stringify(s)))),activeStudy(s));
  }
  assert.equal(seen.size,studyChoices(s).length);
  assert.equal(activeStudy(s)!.id,start);
  s=reducer(s,{type:'study-step',direction:-1});
  assert.equal(activeStudy(s)!.form,5);
});

test('derived study data matches the public selectors across study modes',()=>{
  for(const s of [
    defaultState(),
    {...defaultState(),ghostForms:true},
    {...defaultState(),studyMode:'shape' as const},
    {...defaultState(),studyMode:'string' as const},
    {...defaultState(),studyMode:'nps' as const,scaleId:'major'},
  ]) {
    const derived=deriveStudy(s);
    assert.deepEqual(derived.choices,studyChoices(s));
    assert.deepEqual(derived.study,activeStudy(s));
    assert.deepEqual(derived.ghosts,ghostStudies(s));
  }
});

test('single shapes and diagonals match the reference topology, including edge fragments',()=>{
  for(const shapeKind of ['rectangle','stack'] as const) {
    const s={...{ ...defaultState(), frets: 15 },studyMode:'shape' as const,shapeKind};
    for(const c of studyChoices(s)) { assert.equal(c.shapes.length,1); assert.equal(c.shapes[0].kind,shapeKind); }
  }
  const rectangle={...{ ...defaultState(), frets: 15 },studyMode:'diagonal' as const};
  const rectangles=studyChoices(rectangle);
  assert.deepEqual(rectangles.map(c=>c.shapes[0].id),['rectangle:6:0','rectangle:7:5','rectangle:6:12']);
  assert.deepEqual(rectangles[0].shapes.map(s=>s.id),['rectangle:6:0','rectangle:4:2','rectangle:2:5']);
  for(const id of ['1:10','3:7','5:5']) { const [string,fret]=id.split(':').map(Number); assert.equal(notePresentation(position(string,fret),rectangle).active,true); }
  const stacks=studyChoices({...rectangle,shapeKind:'stack'});
  assert.deepEqual(stacks.map(c=>c.shapes[0].id),['stack:6:-2','stack:7:3','stack:8:8']);
  assert.deepEqual(stacks[1].shapes.map(s=>s.id),['stack:7:3','stack:5:5','stack:3:7','stack:1:10']);
});

test('whole map adds quiet notes, skeleton joins roots, and neither changes the selected form',()=>{
  const s=defaultState();
  const outside=position(3,2), inside=position(1,5);
  assert.equal(notePresentation(outside,s).visible,false);
  for(const key of ['wholeMap','skeleton','warp'] as const) {
    const next=reducer(s,{type:'toggle',key});
    assert.deepEqual(visibleShapes(next),visibleShapes(s));
    assert.equal(notePresentation(inside,next).active,true);
    if(key!=='warp') {
      assert.equal(notePresentation(outside,next).visible,true);
      assert.equal(notePresentation(outside,next).background,true);
    }
  }
  for(let root=0;root<12;root++) for(const {a,b} of rootConnections({...s,root})) {
    assert.equal(a.pitch,root); assert.equal(b.pitch,root);
    assert.ok([2,3].includes(Math.abs(a.string-b.string)));
  }
  assert.equal(notePresentation(position(1,7),{...s,scaleId:'minor',skeleton:true}).visible,true);
  assert.equal(notePresentation(position(1,7),{...s,scaleId:'minor',hideAdded:true}).visible,false);
});

test('old skeleton preferences migrate to the separate pentatonic-only control',()=>{
  const s=restoreState({version:3,skeleton:true});
  assert.equal(s.skeleton,false);
  assert.equal(s.hideAdded,true);
  assert.equal(restoreState({...defaultState(),skeleton:true}).skeleton,true);
});

test('ghost forms returns adjacent forms in position mode and makes adjacent notes visible', () => {
  const s = { ...defaultState(), ghostForms: true };
  const ghosts = ghostStudies(s);
  assert.equal(ghosts.length, 2);
  assert.equal(ghosts[0].form, 5); // Form 5 to the left
  assert.equal(ghosts[1].form, 2); // Form 2 to the right
  assert.ok(ghosts[0].shapes.length > 0);
  assert.ok(ghosts[1].shapes.length > 0);

  // When ghostForms is false or studyMode is not position, ghostStudies is empty
  assert.equal(ghostStudies({ ...s, ghostForms: false }).length, 0);
  assert.equal(ghostStudies({ ...s, studyMode: 'shape' }).length, 0);
  assert.equal(ghostStudies({ ...s, studyMode: 'all' }).length, 0);

  // A note inside Form 2 (e.g. string 1 fret 10) is visible as a ghost note without wholeMap
  const form2Note = position(1, 10);
  const withoutGhosts = notePresentation(form2Note, { ...defaultState(), wholeMap: false });
  assert.equal(withoutGhosts.visible, false);
  const withGhosts = notePresentation(form2Note, s, [], activeStudy(s), ghosts);
  assert.equal(withGhosts.visible, true);
  assert.equal(withGhosts.ghost, true);

  // ghostForms survives restore and toggle
  assert.equal(restoreState({ ...defaultState(), ghostForms: true }).ghostForms, true);
  const toggled = reducer(defaultState(), { type: 'toggle', key: 'ghostForms' });
  assert.equal(toggled.ghostForms, true);
});

test('scale degree isolation dims non-isolated scale tones and highlights the selected degree', () => {
  let s = defaultState(); // A minor pentatonic (root A: 0, 3, 5, 7, 10 semitones)
  assert.deepEqual(s.isolatedTones, []);

  // Isolate minor third (3 semitones from root)
  s = reducer(s, { type: 'isolate-tone', value: 3 });
  assert.deepEqual(s.isolatedTones, [3]);

  // Root note (A: string 1 fret 5) is dimmed because it's not the isolated degree
  const rootNote = position(1, 5);
  const rootPres = notePresentation(rootNote, s);
  assert.equal(rootPres.isolated, false);
  assert.equal(rootPres.degreeDimmed, true);

  // Minor third (C: string 1 fret 8) is isolated and NOT dimmed
  const thirdNote = position(1, 8);
  const thirdPres = notePresentation(thirdNote, s);
  assert.equal(thirdPres.isolated, true);
  assert.equal(thirdPres.degreeDimmed, false);
  assert.ok(thirdPres.aria.includes('isolated degree'));

  // Clear isolation restores all notes
  s = reducer(s, { type: 'clear-isolated-tones' });
  assert.deepEqual(s.isolatedTones, []);
  assert.equal(notePresentation(rootNote, s).degreeDimmed, false);

  // Changing scale clears isolated tones
  s = reducer(s, { type: 'isolate-tone', value: 3 });
  s = reducer(s, { type: 'scale', value: 'major' });
  assert.deepEqual(s.isolatedTones, []);

  // State restoration handles isolatedTones
  assert.deepEqual(restoreState({ ...defaultState(), isolatedTones: [3, 7] }).isolatedTones, [3, 7]);
});
