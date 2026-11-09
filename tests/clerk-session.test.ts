import test from 'node:test';
import assert from 'node:assert/strict';
import { hasClerkSession } from '../src/core/clerk-session';

test('a signed-in cookie, suffixed or not, is a session', () => {
  assert.equal(hasClerkSession('__client_uat=1767225600'), true);
  assert.equal(hasClerkSession('theme=dark; __client_uat_Ab-_3xYz=1767225600; other=1'), true);
});

test('signed out, missing, or unrelated cookies are not', () => {
  assert.equal(hasClerkSession(''), false);
  assert.equal(hasClerkSession('__client_uat=0; __client_uat_Ab-_3xYz=0'), false);
  assert.equal(hasClerkSession('__session=eyJ; __clerk_db_jwt=abc; my__client_uat=5; __client_uatx=5'), false);
  assert.equal(hasClerkSession('__client_uat=garbage'), false);
});

test('one signed-in copy is enough even when the other says signed out', () => {
  assert.equal(hasClerkSession('__client_uat=0; __client_uat_Ab-_3xYz=1767225600'), true);
});
