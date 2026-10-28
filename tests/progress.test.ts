import test from 'node:test';
import assert from 'node:assert/strict';
import { levelOf, practicedForms, practicedTotal, record, restoreProgress } from '../src/core/progress';

test('progress only rises, and counts practiced forms per key and family',()=>{
  let p=record({},'minor',9,1,1);
  assert.equal(levelOf(p,'minor',9,1),1);
  p=record(p,'minor',9,1,2);
  const same=record(p,'minor',9,1,1);
  assert.equal(same,p);
  assert.equal(levelOf(p,'minor',9,1),2);
  assert.equal(levelOf(p,'major',9,1),0);
  for(const form of [2,3,4,5]) p=record(p,'minor',9,form,2);
  p=record(p,'minor',2,3,2);
  p=record(p,'major',0,1,2);
  assert.equal(practicedForms(p,'minor',9),5);
  assert.equal(practicedTotal(p,'minor'),6);
  assert.equal(practicedTotal(p,'major'),1);
});

test('restored progress drops anything malformed',()=>{
  assert.deepEqual(restoreProgress({'minor:9:1':2,'major:11:5':1,'minor:12:1':2,'minor:9:6':1,'dorian:0:1':2,'minor:0:2':3}),{'minor:9:1':2,'major:11:5':1});
  assert.deepEqual(restoreProgress([1,2]),{});
  assert.deepEqual(restoreProgress(null),{});
});
