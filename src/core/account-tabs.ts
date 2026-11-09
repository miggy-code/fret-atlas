import type { Edit } from './sync-edit';
import type { AccountCache } from './sync-cache';

/** What every tab shows: the account's data, the footer status, and whether sync waits on a decision. */
export interface TabView { cache: AccountCache; status: string; deciding: boolean }

/** The one tab that talks to the server. Its sync coordinator is the only writer of the account cache. */
export interface Leader {
  start(): void;
  stop(): void;
  apply(edit: Edit): void;
  view(): TabView;
}

export interface Locks { request(name: string, hold: () => Promise<void>): Promise<void> }

export interface TabSessionOptions {
  locks: Locks;
  lock: string;
  channel: () => BroadcastChannel;
  /** Builds the leader once this tab holds the lock. `changed` reports every change of its view; pass true when the account itself changed. */
  lead: (changed: (fromAccount: boolean) => void) => Promise<Leader>;
  /** Called with each view. `displayChanged` means a change from elsewhere that the screen should now show. */
  show: (view: TabView, displayChanged: boolean) => void;
  fail: (error: unknown) => void;
}

type Wire =
  | { type: 'hello' }
  | { type: 'edit'; from: string; seq: number; edit: Edit }
  | { type: 'state'; leader: string; view: TabView; applied: Record<string, number>; changes: Record<string, number> };

/**
 * Tabs queue on one Web Lock per account. The tab that holds it leads: it owns the cache and the sync.
 * Every other tab sends its edits to the leader and shows what the leader publishes, so the cache has a
 * single writer and no edit can overwrite another. When the leader closes, the next tab in the queue takes over.
 */
export class TabSession {
  readonly id = crypto.randomUUID();
  private generation = 0;
  private channel: BroadcastChannel | undefined;
  private leader: Leader | undefined;
  private release: (() => void) | undefined;
  private quiet = false;
  // Followers keep an edit until the leader confirms it, and send it again to a new leader.
  private outbox: { seq: number; edit: Edit }[] = [];
  private seq = 0;
  private followed = '';
  // Counts of changes by origin (a tab, or the account), so a tab can tell which changes are not its own.
  private changes: Record<string, number> = {};
  private applied: Record<string, number> = {};
  private seen = 0;

  constructor(private options: TabSessionOptions) {}

  get role(): 'leader' | 'follower' { return this.leader ? 'leader' : 'follower'; }

  start() {
    const generation = ++this.generation;
    const channel = this.channel = this.options.channel();
    channel.onmessage = event => { if (this.generation === generation) this.receive(event.data as Wire); };
    channel.postMessage({ type: 'hello' } satisfies Wire);
    this.options.locks.request(this.options.lock, () => this.lead(generation)).catch(() => {});
  }

  stop() {
    this.generation++;
    this.channel?.close();
    this.channel = undefined;
    this.leader?.stop();
    this.leader = undefined;
    this.release?.();
    this.release = undefined;
    this.outbox = [];
    this.followed = '';
    this.seen = 0;
  }

  edit(edit: Edit) {
    if (this.leader) { this.applyEdit(edit, this.id); return; }
    const pending = { seq: ++this.seq, edit };
    this.outbox.push(pending);
    this.send(pending);
  }

  private send({ seq, edit }: { seq: number; edit: Edit }) { this.channel?.postMessage({ type: 'edit', from: this.id, seq, edit } satisfies Wire); }

  private async lead(generation: number) {
    if (this.generation !== generation) return;
    let leader: Leader;
    try { leader = await this.options.lead(fromAccount => this.changed(generation, fromAccount)); }
    catch (error) { if (this.generation === generation) this.options.fail(error); return; }
    if (this.generation !== generation) { leader.stop(); return; }
    this.leader = leader;
    this.changes = {};
    this.applied = {};
    this.seen = 0;
    // What this tab edited before it led is applied first, in order.
    for (const { edit } of this.outbox.splice(0)) this.applyEdit(edit, this.id);
    leader.start();
    this.announce();
    // Holding the lock until stop() is what keeps every other tab following.
    await new Promise<void>(resolve => { this.release = resolve; });
  }

  private receive(message: Wire) {
    if (message.type === 'hello') { if (this.leader) this.broadcast(); return; }
    if (message.type === 'edit') {
      if (!this.leader) return;
      if (message.seq > (this.applied[message.from] ?? 0)) this.applyEdit(message.edit, message.from, message.seq);
      else this.broadcast();
      return;
    }
    if (this.leader) return;
    this.outbox = this.outbox.filter(pending => pending.seq > (message.applied[this.id] ?? 0));
    const foreign = this.foreign(message.changes);
    if (message.leader !== this.followed) {
      // A new leader has not seen what is still waiting.
      this.followed = message.leader;
      this.seen = foreign;
      this.outbox.forEach(pending => this.send(pending));
    }
    // A view that does not yet hold this tab's own edits would take them off the screen.
    if (this.outbox.length) return;
    this.options.show(message.view, foreign > this.seen);
    this.seen = foreign;
  }

  private applyEdit(edit: Edit, source: string, seq?: number) {
    const leader = this.leader!;
    const before = this.fingerprint();
    this.quiet = true;
    try { leader.apply(edit); } finally { this.quiet = false; }
    if (this.fingerprint() !== before) this.count(source);
    if (seq !== undefined) this.applied[source] = seq;
    this.announce();
  }

  private changed(generation: number, fromAccount: boolean) {
    if (this.generation !== generation || !this.leader || this.quiet) return;
    if (fromAccount) this.count('account');
    this.announce();
  }

  private count(source: string) { this.changes[source] = (this.changes[source] ?? 0) + 1; }
  private foreign(changes: Record<string, number>) { return Object.entries(changes).reduce((sum, [source, count]) => source === this.id ? sum : sum + count, 0); }
  private fingerprint() { const { cache } = this.leader!.view(); return JSON.stringify([cache.settings, cache.progress]); }

  private broadcast() {
    this.channel?.postMessage({ type: 'state', leader: this.id, view: this.leader!.view(), applied: this.applied, changes: this.changes } satisfies Wire);
  }
  private announce() {
    this.broadcast();
    const foreign = this.foreign(this.changes);
    this.options.show(this.leader!.view(), foreign > this.seen);
    this.seen = foreign;
  }
}
