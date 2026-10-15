import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,reducer,restoreState,selectedPitches,triadPitches,visibleShapes} from '../src/core/state';
import {notePresentation} from '../src/core/presentation';
import {position} from '../src/core/music';

test('independent major/minor triads have the correct pitches in every key',()=>{
  for(let root=0;root<12;root++) for(const triad of ['major','minor'] as const) {
    const state={...defaultState(),root,triad};
    assert.deepEqual(triadPitches(state),[root,(root+(triad==='major'?4:3))%12,(root+7)%12]);
    for(let string=1;string<=6;string++) for(let fret=0;fret<=24;fret++) {
      const note=position(string,fret);
      assert.equal(notePresentation(note,state).triad,triadPitches(state).includes(note.pitch));
    }
  }
});
test('triads overlay a named scale or custom selection without changing notes, patterns or marks',()=>{
  for(const scaleId of ['minor-pentatonic','custom']) {
    const before={...defaultState(),scaleId,customPitches:[0,2],marks:['2:6']};
    const after=reducer(before,{type:'triad',value:'major'});
    assert.deepEqual(selectedPitches(after),selectedPitches(before));
    assert.deepEqual(after.marks,before.marks);
    assert.deepEqual(visibleShapes(after),visibleShapes(before));
    const third=notePresentation(position(1,9),after); // C♯, outside A minor / C,D custom.
    assert.equal(third.triad,true);
    assert.equal(third.visible,true);
    assert.equal(third.selected,false);
    assert.equal(notePresentation(position(1,9),reducer(after,{type:'triad',value:'off'})).visible,false);
  }
});
test('triad root can follow the key or stay fixed and survives persistence',()=>{
  let s=reducer(defaultState(),{type:'triad',value:'minor'});
  s=reducer(s,{type:'root',value:0});
  assert.deepEqual(triadPitches(s),[0,3,7]);
  s=reducer(s,{type:'triad-root',value:9});
  s=reducer(s,{type:'root',value:2});
  assert.deepEqual(triadPitches(restoreState(JSON.parse(JSON.stringify(s)))),[9,0,4]);
  assert.equal(restoreState({...s,triad:'bad',triadRoot:27}).triad,'off');
  assert.equal(restoreState({...s,triadRoot:27}).triadRoot,null);
});
test('explicit focus still limits triad tones, while marks remain visible',()=>{
  const s={...defaultState(),triad:'minor' as const,focus:true,from:3,to:8,strings:[1,2]};
  assert.equal(notePresentation(position(6,5),s).visible,false);
  assert.equal(notePresentation(position(1,12),s).visible,false);
  assert.equal(notePresentation(position(1,5),s).visible,true);
  assert.equal(notePresentation(position(6,5),{...s,marks:['6:5']}).visible,true);
});
test('old triad-only studies preserve their exact notes and become custom selections plus highlighting',()=>{
  for(const quality of ['major','minor']) {
    const migrated=restoreState({version:3,scaleId:`${quality}-triad`,root:9,marks:['1:5']});
    assert.equal(migrated.scaleId,'custom');
    assert.equal(migrated.triad,quality);
    assert.deepEqual(migrated.customPitches,quality==='major'?[9,1,4]:[9,0,4]);
    assert.equal(migrated.triadRoot,9);
    assert.deepEqual(migrated.marks,['1:5']);
  }
  const restored=restoreState({version:3,scaleId:'minor-pentatonic'});
  assert.equal(restored.triad,'off');
  assert.equal(restored.triadRoot,null);
});
