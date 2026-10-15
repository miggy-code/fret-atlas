import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, reducer, restoreState, visibleShapes } from '../src/core/state';
import { notePresentation } from '../src/core/presentation';
import { position } from '../src/core/music';

test('the default form has one stack and two rectangles, including the low-E fragment', () => {
  const shapes = visibleShapes(defaultState());
  assert.equal(shapes.filter(s=>s.kind==='rectangle').length,2);
  assert.equal(shapes.filter(s=>s.kind==='stack').length,1);
  assert.ok(shapes.some(s=>s.id==='rectangle:2:5'));
  assert.ok(shapes.some(s=>s.id==='stack:5:5'));
  assert.ok(shapes.some(s=>s.partial && s.endpoints.includes('6:5') && s.endpoints.includes('6:8')));
  assert.equal(new Set(shapes.map(s=>s.endpoints.join(','))).size,shapes.length);
});
test('pattern and row toggles never hide notes or cut a shape into arbitrary row slices', () => {
  const before=defaultState();
  const after=reducer(before,{type:'overlay-row',value:2});
  assert.ok(visibleShapes(after).length<visibleShapes(before).length);
  assert.ok(visibleShapes(after).every(s=>s.rows.every(row=>row.string!==2)));
  const off=reducer(reducer(before,{type:'pattern',value:'rectangle'}),{type:'pattern',value:'stack'});
  assert.deepEqual(visibleShapes(off),[]);
  for(let string=1;string<=6;string++) for(let fret=0;fret<=15;fret++) {
    const n=position(string,fret);
    assert.equal(notePresentation(n,off).visible,notePresentation(n,before).visible);
    assert.equal(notePresentation(n,after).visible,notePresentation(n,before).visible);
  }
});
test('v2 single-shape saves migrate with key, scale, focus, rows, labels and marks preserved', () => {
  const after=restoreState({version:2,root:3,scaleId:'minor',lens:'shape',kind:'stack',shapeId:'stack:5:5',wholeMap:false,labels:'intervals',marks:['6:5'],overlayRows:[1,2,3],focus:true,from:0,to:12});
  assert.deepEqual(after.patterns,['stack']);
  assert.equal(after.root,3);
  assert.equal(after.scaleId,'minor');
  assert.deepEqual(after.marks,['6:5']);
  assert.equal(after.labels,'intervals');
  assert.equal(after.focus,true);
  assert.deepEqual(after.overlayRows,[1,2,3]);
  assert.deepEqual(restoreState({version:2,lens:'map'}).patterns,[]);
  assert.deepEqual(restoreState({version:1,overlay:'rectangle',scale:'minor'}).patterns,['rectangle']);
});
test('preferences survive key and scale changes, including unsupported scales, and invalid storage is sanitized', () => {
  let s=reducer(defaultState(),{type:'pattern',value:'rectangle'});
  s=reducer(s,{type:'scale',value:'custom'});
  assert.deepEqual(visibleShapes(s),[]);
  s=reducer(s,{type:'scale',value:'major-pentatonic'});
  s=reducer(s,{type:'root',value:3});
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s))).patterns,['stack']);
  assert.ok(visibleShapes(s).every(shape=>shape.kind==='stack'));
  assert.deepEqual(restoreState({...s,patterns:['stack','bad','stack'],overlayRows:[0,1,1,3,7]}).overlayRows,[1,3]);
  assert.deepEqual(restoreState({...s,patterns:[],overlayRows:[]}).patterns,[]);
});
test('legacy marker colors restore as the focused chord-tone highlighting preference', () => {
  assert.equal(restoreState({ version: 3, colors: 'charms' }).chordColors, true);
  assert.equal(restoreState({ version: 3, colors: 'root' }).chordColors, false);
});
test('shift visibility never changes notes, pattern geometry or handedness', () => {
  const before=defaultState();
  const after=reducer(before,{type:'toggle',key:'warp'});
  assert.deepEqual(visibleShapes(before),visibleShapes(after));
  assert.deepEqual(visibleShapes(after),visibleShapes({...after,leftHanded:true}));
});
test('display reset restores pattern controls while keeping the musical study and marks', () => {
  const s={...defaultState(),root:3,patterns:[],overlayRows:[],marks:['1:5']};
  const reset=reducer(s,{type:'reset-view'});
  assert.deepEqual(reset.patterns,['rectangle','stack']);
  assert.deepEqual(reset.overlayRows,[1,2,3,4,5,6]);
  assert.deepEqual(reset.marks,s.marks);
  assert.equal(reset.root,s.root);
});
