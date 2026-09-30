/**
 * Orquestra as duas metades da consistência eventual: drenar o outbox (push) e
 * aplicar o delta do servidor (pull).
 *
 * Ordem: PUSH antes de PULL, sempre. Se puxássemos primeiro, o delta traria o
 * contador de curtidas anterior à nossa própria escrita e a UI piscaria de volta
 * ao valor antigo até a próxima sync.
 */

import { RETRY_POLICY, FEED_SYNC_KEY, MAX_POSTS } from '../config';
import {
  emptyOutcome,
  mergeDelta,
  partitionOrphans,
  recordFailure,
  selectSendable,
  type OutboxEntry,
  type SyncOutcome,
  type SyncReason,
} from '../domain';
import type { ImageCache } from '../data/images/imageCache';
import type { LocalStore } from '../data/local/localStore';
import {
  describeError,
  isTransportError,
  type RemoteDataSource,
} from '../data/remote/remoteDataSource';

export interface SyncEngineDeps {
  store: LocalStore;
  remote: RemoteDataSource;
  images: ImageCache;
  /** Injetável para o teste não depender do relógio real. */
  now?: () => number;
}

export class SyncEngine {
  private readonly store: LocalStore;
  private readonly remote: RemoteDataSource;
  private readonly images: ImageCache;
  private readonly now: () => number;

  /**
   * Garantia de execução única: a promessa em andamento é o próprio lock. Duas
   * chamadas concorrentes (ex.: foreground e volta da rede no mesmo instante)
   * não podem aplicar dois merges sobre o mesmo estado.
   */
  private running: Promise<SyncOutcome> | null = null;
  private listeners = new Set<() => void>();

  constructor(deps: SyncEngineDeps) {
    this.store = deps.store;
    this.remote = deps.remote;
    this.images = deps.images;
    this.now = deps.now ?? (() => Date.now());
  }

  get isSyncing(): boolean {
    return this.running !== null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async sync(reason: SyncReason): Promise<SyncOutcome> {
    if (this.running !== null) {
      // trade-off: a segunda chamada é descartada em vez de enfileirada. Para um
      // feed de 20 itens, sincronizar de novo logo depois não agrega nada — e
      // enfileirar abriria espaço para uma fila crescer sem controle.
      return { ...emptyOutcome(reason), skipped: true };
    }

    this.running = this.run(reason);
    this.emit();
    try {
      return await this.running;
    } finally {
      this.running = null;
      this.emit();
    }
  }

  private async run(reason: SyncReason): Promise<SyncOutcome> {
    const outcome = emptyOutcome(reason);

    try {
      const push = await this.push();
      outcome.pushed = push.pushed;
      outcome.failed = push.failed;

      const pull = await this.pull();
      outcome.pulled = pull.pulled;
      outcome.deleted = pull.deleted;
      outcome.ok = true;
    } catch (error) {
      outcome.ok = false;
      outcome.error = describeError(error);
    }

    return outcome;
  }

  // --- push --------------------------------------------------------------------

  private async push(): Promise<{ pushed: number; failed: number }> {
    const entries = await this.store.listOutbox();
    if (entries.length === 0) return { pushed: 0, failed: 0 };

    const localPosts = await this.store.listPosts();
    const existing = new Set(localPosts.map((post) => post.id));
    const { keep, orphans } = partitionOrphans(entries, existing);
    if (orphans.length > 0) {
      await this.store.deleteOutbox(orphans.map((entry) => entry.id));
    }

    const nowMs = this.now();
    let pushed = 0;
    let failed = 0;

    for (const entry of selectSendable(keep, nowMs, RETRY_POLICY)) {
      const sent = await this.sendOne(entry, nowMs);
      if (sent === 'ok') pushed += 1;
      else if (sent === 'failed') failed += 1;
      else break; // offline: parar de drenar, o resto continua pendente
    }

    return { pushed, failed };
  }

  private async sendOne(
    entry: OutboxEntry,
    nowMs: number,
  ): Promise<'ok' | 'failed' | 'offline'> {
    try {
      // O servidor recebe o estado desejado + a chave de idempotência (o id da
      // entrada): reenviar a mesma escrita não dobra o contador.
      const ack = await this.remote.sendLike(entry.entityId, entry.kind === 'like', entry.id);
      await this.store.applyServerLike(entry.entityId, ack.likesCount, ack.likedByMe);
      await this.store.deleteOutbox([entry.id]);
      return 'ok';
    } catch (error) {
      if (isTransportError(error)) {
        // Sem rede não é falha da escrita: não gasta tentativa, não vira `dead`.
        return 'offline';
      }
      await this.store.updateOutbox(
        recordFailure(entry, describeError(error), nowMs, RETRY_POLICY),
      );
      return 'failed';
    }
  }

  // --- pull --------------------------------------------------------------------

  private async pull(): Promise<{ pulled: number; deleted: number }> {
    const state = await this.store.getSyncState(FEED_SYNC_KEY);
    const delta = await this.remote.fetchDelta(state?.cursor ?? null);

    const local = await this.store.listPosts();
    const nowIso = new Date(this.now()).toISOString();
    const merged = mergeDelta({
      local,
      incoming: delta.posts,
      deletedIds: delta.deleted,
      now: nowIso,
      maxPosts: MAX_POSTS,
    });

    await this.store.applyMerge(merged.posts, merged.droppedIds);

    // Só depois de o merge ter sido persistido os binários podem sumir: se o app
    // morrer no meio, sobra arquivo órfão (barato) e não post sem imagem (feio).
    if (merged.droppedIds.length > 0) {
      await this.images.drop(merged.droppedIds);
      const remaining = await this.store.listOutbox();
      const { orphans } = partitionOrphans(remaining, new Set(merged.posts.map((p) => p.id)));
      if (orphans.length > 0) {
        await this.store.deleteOutbox(orphans.map((entry) => entry.id));
      }
    }

    await this.images.ensure(
      merged.posts.map((post) => ({ key: post.id, url: post.thumbUrl })),
    );

    await this.store.setSyncState({
      key: FEED_SYNC_KEY,
      cursor: delta.cursor,
      lastSuccessAt: nowIso,
    });

    return { pulled: delta.posts.length, deleted: delta.deleted.length };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
