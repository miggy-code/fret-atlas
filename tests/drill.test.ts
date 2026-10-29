import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, reducer } from '../src/core/state';
import { activeStudy } from '../src/core/study';
import { position } from '../src/core/music';
import { formDrillAvailable, nextDrill, tapResult } from '../src/core/drill';

const cycle = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

test('string drills find every occurrence of the pitch on one string',()=>{
  const s=defaultState();
  // Without a form on screen, every drill is a string drill.
  const drill=nextDrill(s,undefined,undefined,cycle([0]))!;
  assert.equal(drill.kind,'string');
  assert.ok(drill.targets.length>0);
  for(const id of drill.targets) {
    const [string,fret]=id.split(':').map(Number);
    assert.equal(position(string,fret).pitch,drill.pitch);
    assert.equal(string,drill.zone[0].string);
  }
  const [string]=drill.targets[0].split(':').map(Number);
  const everywhere=Array.from({length:s.frets+1},(_,fret)=>position(string,fret)).filter(n=>n.pitch===drill.pitch);
  assert.equal(drill.targets.length,everywhere.length);
});

test('form drills stay inside the active form and name it',()=>{
  const s=reducer(defaultState(),{type:'form',value:3});
  const study=activeStudy(s)!;
  assert.ok(formDrillAvailable(s,study));
  const drill=nextDrill(s,study,undefined,cycle([0]))!;
  assert.equal(drill.kind,'form');
  assert.match(drill.where,/Form 3/);
  for(const id of drill.targets) {
    const [string,fret]=id.split(':').map(Number);
    assert.ok(study.rows.some(row=>row.string===string&&fret>=row.left&&fret<=row.right));
  }
});

test('drills respect focus, spell the key, and never repeat the last prompt',()=>{
  let s=reducer(defaultState(),{type:'string',value:6});
  s=reducer(s,{type:'study-mode',value:'all'});
  assert.equal(formDrillAvailable(s,activeStudy(s)),false);
  const seen=new Set<string>();
  let previous: string|undefined;
  for(let i=0;i<40;i++) {
    const drill=nextDrill(s,activeStudy(s),previous)!;
    assert.notEqual(drill.key,previous);
    assert.equal(drill.kind,'string');
    assert.ok(drill.zone.every(row=>row.string!==6));
    seen.add(drill.name);
    previous=drill.key;
  }
  // A minor pentatonic: A C D E G, spelled from the key.
  assert.deepEqual([...seen].sort(),['A','C','D','E','G']);
});

test('taps report hits, repeats and misses',()=>{
  const drill=nextDrill(defaultState(),undefined,undefined,cycle([0]))!;
  const target=drill.targets[0];
  assert.equal(tapResult(drill,[],target),'hit');
  assert.equal(tapResult(drill,[target],target),'repeat');
  const [string]=target.split(':').map(Number);
  const wrong=Array.from({length:16},(_,f)=>`${string}:${f}`).find(id=>!drill.targets.includes(id))!;
  assert.equal(tapResult(drill,[],wrong),'miss');
});

test('targeted degree practice stays in the current form and focused strings',()=>{
  let s=reducer(defaultState(),{type:'form',value:3});
  s=reducer(s,{type:'string',value:1});
  const study=activeStudy(s)!;
  const drill=nextDrill(s,study,undefined,cycle([0]),{pitches:[s.root],label:'roots'})!;
  assert.equal(drill.kind,'form');
  assert.equal(drill.group,'roots');
  assert.equal(drill.pitch,s.root);
  assert.ok(drill.targets.length>0);
  for(const id of drill.targets) {
    const [string,fret]=id.split(':').map(Number);
    assert.notEqual(string,1);
    assert.ok(study.rows.some(row=>row.string===string&&fret>=row.left&&fret<=row.right));
  }
});

test('targeted chord practice permits tones outside the scale across the whole neck',()=>{
  const s=reducer(defaultState(),{type:'study-mode',value:'all'});
  const study=activeStudy(s)!;
  // C♯ is outside A minor pentatonic but is valid for an overlaid A major chord.
  const drill=nextDrill(s,study,undefined,cycle([0]),{pitches:[1],label:'A major'})!;
  assert.equal(drill.kind,'view');
  assert.equal(drill.name,'C♯');
  assert.ok(drill.targets.length>1);
  assert.ok(drill.targets.some(id=>id.startsWith('1:')));
  assert.ok(drill.targets.some(id=>id.startsWith('6:')));
});

test('targeted practice has no fallback when the requested tones are outside focus',()=>{
  let s=reducer(defaultState(),{type:'study-mode',value:'all'});
  s=reducer(s,{type:'range',from:0,to:0});
  s=reducer(s,{type:'toggle',key:'focus'});
  assert.equal(nextDrill(s,activeStudy(s),undefined,cycle([0]),{pitches:[1],label:'C♯'}),undefined);
});
