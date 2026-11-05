import test from 'node:test';
import assert from 'node:assert/strict';
import { handleClerkDeletion } from '../supabase/functions/clerk-deletion/handler';

const request = () => new Request('https://example.test', { method: 'POST' });
test('only verified deletion events remove user data', async () => {
  let removed = '';
  const remove = async (id: string) => { removed = id; };
  assert.equal((await handleClerkDeletion(request(), async () => { throw Error('invalid'); }, remove)).status, 401);
  assert.equal((await handleClerkDeletion(request(), async () => ({ type: 'user.updated', data: { id: 'user_123' } }), remove)).status, 204);
  assert.equal((await handleClerkDeletion(request(), async () => ({ type: 'user.deleted', data: { id: '../bad' } }), remove)).status, 400);
  assert.equal(removed, '');
  assert.equal((await handleClerkDeletion(request(), async () => ({ type: 'user.deleted', data: { id: 'user_123' } }), remove)).status, 204);
  assert.equal(removed, 'user_123');
});

test('database failures remain retryable', async () => {
  const result = await handleClerkDeletion(request(), async () => ({ type: 'user.deleted', data: { id: 'user_123' } }), async () => { throw Error('offline'); });
  assert.equal(result.status, 503);
});
