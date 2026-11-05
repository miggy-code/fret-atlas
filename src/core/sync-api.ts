import type { Progress } from './progress';
import { restoreProgress } from './progress';

export interface SyncRow {
  user_id: string;
  settings: Record<string, unknown>;
  settings_revision: number;
  progress: Progress;
  reset_generation: number;
}
export interface SyncResult {
  status: 'ok' | 'conflict' | 'reset_conflict';
  row: SyncRow;
}
export type SyncOperation =
  | { operation: 'initialize' }
  | { operation: 'settings'; data: Record<string, unknown>; expected: number }
  | { operation: 'progress'; data: Progress; expected: number }
  | { operation: 'reset'; expected: number };

/** Obtain a fresh Clerk session token for each request; never fall back to anonymous writes. */
export async function syncChange(url: string, publishableKey: string, getToken: () => Promise<string | null>, change: SyncOperation, request: typeof fetch = fetch): Promise<SyncResult> {
  const token = await getToken();
  if (!token) throw new Error('Sign in again to sync');
  const response = await request(`${url.replace(/\/$/, '')}/rest/v1/rpc/sync_change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: publishableKey, Authorization: `Bearer ${token}` },
    body: JSON.stringify(change),
  });
  if (!response.ok) throw new Error(`Sync request failed (${response.status})`);
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('status' in result) || !['ok', 'conflict', 'reset_conflict'].includes(String(result.status)) || !('row' in result) || !result.row || typeof result.row !== 'object' || Array.isArray(result.row)) {
    throw new Error('Invalid sync response');
  }
  const row = result.row as Record<string, unknown>;
  if (typeof row.user_id !== 'string' || !row.user_id || !row.settings || typeof row.settings !== 'object' || Array.isArray(row.settings) ||
    !Number.isSafeInteger(row.settings_revision) || (row.settings_revision as number) < 0 || !Number.isSafeInteger(row.reset_generation) || (row.reset_generation as number) < 0 ||
    !row.progress || typeof row.progress !== 'object' || Array.isArray(row.progress) || Object.keys(restoreProgress(row.progress)).length !== Object.keys(row.progress).length) {
    throw new Error('Invalid sync response');
  }
  return result as SyncResult;
}
