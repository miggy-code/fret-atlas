// Development only: exercises real Clerk tokens and Supabase, then deletes its own test users.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const env = Object.fromEntries((await readFile('.env.local', 'utf8')).split('\n').filter(l => l && !l.startsWith('#') && l.includes('=')).map(l => {
  const i = l.indexOf('=');
  return [l.slice(0, i), l.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
}));
assert.ok(env.CLERK_SECRET_KEY?.startsWith('sk_test_'), 'Use a development Clerk instance');
assert.equal(new URL(env.VITE_SUPABASE_URL).hostname, 'xbuivanpcmkzyldlmpkm.supabase.co', 'Use fret-atlas-dev');

async function clerk(path, method = 'GET', body) {
  const r = await fetch(`https://api.clerk.com/v1/${path}`, {
    method, headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'fret-atlas-verification/1.0' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) {
    const error = new Error(`Clerk ${method} ${path.split('/')[0]}: ${r.status} ${JSON.stringify(data.errors?.map(e => ({ code: e.code, message: e.message })))}`);
    error.status = r.status;
    throw error;
  }
  return data;
}
async function rpc(token, body, expectedStatus = 200) {
  const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/sync_change`, {
    method: 'POST', headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  assert.equal(r.status, expectedStatus, `Supabase status: ${r.status}; code: ${result.code ?? 'none'}`);
  return result;
}

const users = [];
const report = [];
const record = message => { report.push(message); console.log(message); };
try {
  for (const label of ['a', 'b']) {
    const user = await clerk('users', 'POST', { username: `codex_sync_${Date.now()}_${label}`, email_address: [`codex-sync-${Date.now()}-${label}+clerk_test@example.com`], skip_password_requirement: true });
    users.push(user.id);
  }
  const session = async userId => clerk('sessions', 'POST', { user_id: userId });
  const token = async s => (await clerk(`sessions/${s.id}/tokens`, 'POST')).jwt;
  const [sa1, sa2, sb] = await Promise.all([session(users[0]), session(users[0]), session(users[1])]);
  const [ta1, ta2, tb] = await Promise.all([token(sa1), token(sa2), token(sb)]);
  const claims = JSON.parse(Buffer.from(ta1.split('.')[1], 'base64url').toString());
  assert.equal(claims.role, 'authenticated');
  assert.equal(claims.sub, users[0]);
  record('PASS: real Clerk session tokens include the authenticated role.');
  const a = await rpc(ta1, { operation: 'initialize' });
  assert.equal(a.row.user_id, users[0]);
  const settings = { view: { key: 2, leftHanded: true }, theme: 'dark', sound: 'off' };
  await rpc(ta1, { operation: 'settings', data: settings, expected: a.row.settings_revision });
  await rpc(ta1, { operation: 'progress', data: { 'minor:2:3': 2 }, expected: a.row.reset_generation });
  const second = await rpc(ta2, { operation: 'initialize' });
  assert.deepEqual(second.row.settings, settings);
  assert.deepEqual(second.row.progress, { 'minor:2:3': 2 });
  record('PASS: a second independent Clerk session reads persisted settings and progress.');
  const b = await rpc(tb, { operation: 'initialize' });
  assert.equal(b.row.user_id, users[1]);
  assert.deepEqual(b.row.settings, {});
  assert.deepEqual(b.row.progress, {});
  const read = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/sync_data?user_id=eq.${users[0]}`, { headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${tb}` } });
  assert.equal(read.status, 200);
  assert.deepEqual(await read.json(), []);
  record('PASS: a different account cannot read the first account’s row through the Data API.');
  const conflict = await rpc(ta2, { operation: 'settings', data: { theme: 'light' }, expected: a.row.settings_revision });
  assert.equal(conflict.status, 'conflict');
  assert.deepEqual(conflict.row.settings, settings);
  await rpc(ta1, { operation: 'reset', expected: a.row.reset_generation });
  const stale = await rpc(ta2, { operation: 'progress', data: { 'minor:2:3': 2 }, expected: a.row.reset_generation });
  assert.equal(stale.status, 'reset_conflict');
  assert.deepEqual(stale.row.progress, {});
  record('PASS: stale settings and pre-reset progress cannot overwrite newer account data.');
  await rpc(null, { operation: 'initialize' }, 401);
  record('PASS: anonymous sync is rejected.');
  const r = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/clerk-deletion`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'user.deleted', data: { id: users[0] } }) });
  assert.equal(r.status, 401);
  record('PASS: an unsigned deletion event is rejected.');
  await clerk(`users/${users[0]}`, 'DELETE');
  // Keep the existing token to verify a real webhook prevents old-token recreation.
  let deleted = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/sync_change`, { method: 'POST', headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${ta1}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'initialize' }) });
    const body = await r.json();
    if (body.message === 'Account deleted') { deleted = true; break; }
    assert.equal(r.status, 200, `Unexpected deletion check: ${r.status} ${body.code}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(deleted, 'Real Clerk user.deleted webhook must block old-token recreation within 20 seconds');
  const surviving = await rpc(tb, { operation: 'initialize' });
  assert.equal(surviving.row.user_id, users[1]);
  record('PASS: real Clerk deletion webhook removes the test account, blocks old tokens, and leaves the other account accessible.');
} catch (error) {
  record(`FAIL: ${error.message}`);
  throw error;
} finally {
  for (const userId of users) {
    try { await clerk(`users/${userId}`, 'DELETE'); }
    catch (e) {
      if (e.status !== 404) { record(`FAIL: test user cleanup: ${e.message}`); process.exitCode = 1; }
    }
  }
  await writeFile('/tmp/fret-atlas-live-sync-verification.txt', `${new Date().toISOString()}\n${report.join('\n')}\n`);
}
