import test from 'node:test';
import assert from 'node:assert/strict';
import { deviceEdits, PROGRESS_KEY, readDevice, SOUND_KEY, THEME_KEY } from '../src/core/device-copy';
import { defaultState, STORAGE_KEY } from '../src/core/state';

const storage = (entries: Record<string, string>) => ({ getItem: (key: string) => entries[key] ?? null });

test('a device with nothing saved reads as the defaults', () => {
  assert.deepEqual(readDevice(storage({})), { settings: { view: defaultState(), theme: 'light', sound: 'on' }, progress: {} });
});

test('damaged device data reads as the defaults instead of throwing', () => {
  const device = readDevice(storage({ [STORAGE_KEY]: '{oops', [PROGRESS_KEY]: '[1]', [THEME_KEY]: 'sepia' }));
  assert.deepEqual(device, { settings: { view: defaultState(), theme: 'light', sound: 'on' }, progress: {} });
});

test('nothing changed on the device means nothing to carry over', () => {
  const before = readDevice(storage({ [STORAGE_KEY]: JSON.stringify({ ...defaultState(), root: 3 }), [PROGRESS_KEY]: '{"minor:9:1":2}' }));
  assert.equal(deviceEdits(before, readDevice(storage({ [STORAGE_KEY]: JSON.stringify({ ...defaultState(), root: 3 }), [PROGRESS_KEY]: '{"minor:9:1":2}' }))), undefined);
});

test('only what changed during the wait is carried over', () => {
  const before = readDevice(storage({ [STORAGE_KEY]: JSON.stringify({ ...defaultState(), root: 3 }) }));
  const after = readDevice(storage({
    [STORAGE_KEY]: JSON.stringify({ ...defaultState(), root: 3, leftHanded: true }), [THEME_KEY]: 'dark', [SOUND_KEY]: 'off', [PROGRESS_KEY]: '{"minor:9:2":1}',
  }));
  assert.deepEqual(deviceEdits(before, after), { settings: { view: { leftHanded: true }, theme: 'dark', sound: 'off' }, progress: { 'minor:9:2': 1 } });
});
