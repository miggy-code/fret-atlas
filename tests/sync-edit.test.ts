import test from 'node:test';
import assert from 'node:assert/strict';
import { appSettings, applySettings, diffSettings } from '../src/core/sync-edit';
import { defaultState } from '../src/core/state';

const settings = (view = {}, theme: 'light' | 'dark' = 'light', sound: 'on' | 'off' = 'on') => ({ view: { ...defaultState(), ...view }, theme, sound });

test('a diff holds only the fields that changed', () => {
  assert.equal(diffSettings(settings(), settings()), undefined);
  assert.deepEqual(diffSettings(settings(), settings({ leftHanded: true, marks: ['1:2'] }, 'dark')), { view: { leftHanded: true, marks: ['1:2'] }, theme: 'dark' });
});

test('two changes to different settings both survive being applied to the stored copy', () => {
  const stored = { view: { root: 2 }, theme: 'light', sound: 'on', other: 'kept' };
  const one = applySettings(stored, diffSettings(settings(), settings({ leftHanded: true }))!);
  const both = applySettings(one, diffSettings(settings(), settings({}, 'dark'))!);
  assert.deepEqual(both, { view: { root: 2, leftHanded: true }, theme: 'dark', sound: 'on', other: 'kept' });
});

test('a delta applies to stored settings that have no view yet', () => {
  assert.deepEqual(applySettings({}, { view: { root: 4 } }), { view: { root: 4 } });
  assert.deepEqual(applySettings({ view: 'broken' }, { sound: 'off' }), { view: 'broken', sound: 'off' });
});

test('stored settings read as the app would show them', () => {
  assert.deepEqual(appSettings({}), settings());
  assert.deepEqual(appSettings({ view: { version: 4, root: 2 }, theme: 'dark', sound: 'off' }), settings({ root: 2 }, 'dark', 'off'));
});
