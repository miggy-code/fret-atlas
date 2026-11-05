import test from 'node:test';
import assert from 'node:assert/strict';
import { syncChange } from '../src/core/sync-api';

test('sync sends a fresh session token and does not report failed uploads as successful', async () => {
  let calls = 0;
  const request: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://example.supabase.co/rest/v1/rpc/sync_change');
    assert.equal((options?.headers as Record<string, string>).Authorization, 'Bearer clerk-token');
    assert.deepEqual(JSON.parse(String(options?.body)), { operation: 'reset', expected: 4 });
    return new Response('', { status: 503 });
  };
  await assert.rejects(syncChange('https://example.supabase.co/', 'public-key', async () => 'clerk-token', { operation: 'reset', expected: 4 }, request), /503/);
  await assert.rejects(syncChange('https://example.supabase.co', 'public-key', async () => null, { operation: 'initialize' }, request), /Sign in/);
  assert.equal(calls, 1);
});

test('sync preserves server conflict responses and rejects malformed responses', async () => {
  const row = { user_id: 'user_1', settings: {}, settings_revision: 1, progress: {}, reset_generation: 2 };
  const reply: typeof fetch = async () => Response.json({ status: 'reset_conflict', row });
  assert.deepEqual(await syncChange('https://example.supabase.co', 'public-key', async () => 'token', { operation: 'initialize' }, reply), { status: 'reset_conflict', row });
  const malformed: typeof fetch = async () => Response.json({ status: 'ok' });
  await assert.rejects(syncChange('https://example.supabase.co', 'public-key', async () => 'token', { operation: 'initialize' }, malformed), /Invalid sync response/);
});
