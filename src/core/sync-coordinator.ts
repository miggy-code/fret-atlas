import { mergeProgress, reconcileAccount } from './sync';
import type { SyncConflict } from './sync';
import type { AccountCache } from './sync-cache';
import type { SyncOperation, SyncResult } from './sync-api';

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pending = (cache: AccountCache) => cache.settingsPending || cache.progressPending || cache.resetPending;

export interface SyncDependencies {
  save: (cache: AccountCache) => void;
  call: (operation: SyncOperation, current: () => boolean) => Promise<SyncResult>;
  confirm: (conflict: SyncConflict) => boolean;
  update: (cache: AccountCache, status: string, displayChanged: boolean) => void;
}

/** Owns the account cache and serializes network work; each start has its own cancellation epoch. */
export class SyncCoordinator {
  private cache: AccountCache;
  private epoch = 0;
  private active = false;
  private running = false;
  private queued = false;
  private resetSerial = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private interval: ReturnType<typeof setInterval> | undefined;
  private status = 'Sync pending';

  constructor(initial: AccountCache, private deps: SyncDependencies, private configured: boolean) { this.cache = initial; }

  start() {
    this.active = true;
    this.epoch++;
    if (!this.configured) { this.publish('Sync unavailable · missing configuration'); return; }
    this.interval = setInterval(() => this.wake(), 30000);
    this.wake();
  }
  stop() {
    this.active = false;
    this.epoch++;
    clearTimeout(this.timer);
    clearInterval(this.interval);
    this.running = false;
    this.queued = false;
  }
  settings(settings: AccountCache['settings']) {
    if (!equal(this.cache.settings, settings) && this.save({ ...this.cache, settings, settingsPending: true })) this.changed();
  }
  progress(progress: AccountCache['progress']) {
    if (!equal(this.cache.progress, progress) && this.save({ ...this.cache, progress, progressPending: true })) this.changed();
  }
  clear() {
    if (this.save({ ...this.cache, progress: {}, progressPending: false, resetPending: true })) { this.resetSerial++; this.changed(); }
  }
  private publish(status: string, displayChanged = false) { this.status = status; this.deps.update(this.cache, status, displayChanged); }
  private save(cache: AccountCache): boolean {
    try { this.deps.save(cache); this.cache = cache; return true; }
    catch { this.publish('Storage unavailable · changes cannot be synced'); return false; }
  }
  private apply(cache: AccountCache, displayChanged = false) {
    if (!this.save(cache)) throw new Error('Local storage unavailable');
    if (displayChanged) this.publish(this.status, true);
  }
  private changed() { this.publish(this.active && !this.configured ? 'Sync unavailable · missing configuration' : 'Sync pending'); this.schedule(); }
  private schedule() {
    if (!this.active || !this.configured) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.wake(), 500);
  }
  wake() {
    if (!this.active || !this.configured) return;
    if (this.running) { this.queued = true; return; }
    this.running = true;
    const epoch = this.epoch;
    const current = () => this.active && this.epoch === epoch;
    this.run(current).catch((error: unknown) => {
      if (current()) this.publish(error instanceof Error && error.message === 'Local storage unavailable' ? 'Storage unavailable · changes cannot be synced' : 'Sync failed · changes saved on this device');
    }).finally(() => {
      if (!current()) return;
      this.running = false;
      if (this.queued) { this.queued = false; this.schedule(); }
    });
  }
  private async run(current: () => boolean) {
    const call = async (operation: SyncOperation) => {
      if (!current()) throw new Error('Account changed');
      const result = await this.deps.call(operation, current);
      if (!current()) throw new Error('Account changed');
      return result;
    };
    let response = await call({ operation: 'initialize' });
    const choices: Partial<Record<SyncConflict, boolean>> = {};
    let reconciled = reconcileAccount(this.cache, response.row, choices);
    while (reconciled.kind === 'conflict') {
      choices[reconciled.conflict] = this.deps.confirm(reconciled.conflict);
      if (!current()) return;
      reconciled = reconcileAccount(this.cache, response.row, choices);
    }
    this.apply(reconciled.cache, reconciled.displayChanged);
    if (this.cache.settingsPending) {
      const sent = this.cache.settings;
      response = await call({ operation: 'settings', data: sent, expected: this.cache.settingsRevision! });
      if (response.status !== 'ok') { this.schedule(); return; }
      this.apply({ ...this.cache, settingsRevision: response.row.settings_revision, settingsPending: !equal(this.cache.settings, sent) });
    }
    if (this.cache.resetPending) {
      const serial = this.resetSerial;
      response = await call({ operation: 'reset', expected: this.cache.resetGeneration! });
      if (response.status !== 'ok') { this.schedule(); return; }
      this.apply({ ...this.cache, resetGeneration: response.row.reset_generation, resetPending: this.resetSerial !== serial, progressPending: Object.keys(this.cache.progress).length > 0 });
    }
    if (this.cache.resetPending) { this.schedule(); return; }
    if (this.cache.progressPending) {
      const sent = this.cache.progress;
      response = await call({ operation: 'progress', data: sent, expected: this.cache.resetGeneration! });
      if (response.status !== 'ok' || this.cache.resetPending) { this.schedule(); return; }
      const progress = mergeProgress(this.cache.progress, response.row.progress);
      this.apply({ ...this.cache, progress, progressPending: !equal(this.cache.progress, sent) }, !equal(this.cache.progress, progress));
    }
    if (pending(this.cache)) { this.publish('Sync pending'); this.schedule(); }
    else this.publish('Synced');
  }
}
