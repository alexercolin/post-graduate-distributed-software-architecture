/**
 * FeedRepository — a única superfície que a UI enxerga.
 *
 * Regra de dependência: a UI depende disto, isto depende de LocalStore /
 * ImageCache / SyncEngine, e nenhuma dessas conhece a de cima. Nenhum componente
 * faz fetch: se a UI precisar de algo que não está aqui, o erro está nesta API.
 *
 * Stale-while-revalidate: `observeFeed` emite o estado local IMEDIATAMENTE e só
 * depois dispara a revalidação, que emite de novo. Offline é caso particular
 * disso — a revalidação falha e a primeira emissão continua valendo.
 */

import { FEED_SYNC_KEY, MAX_POSTS, TTL_MS } from '../../config';
import {
  composeFeed,
  formatLastSync,
  isExpired,
  nextLikeAction,
  planEnqueue,
  deriveLikeState,
  type CacheEntry,
  type FeedItem,
  type OutboxEntry,
  type Post,
  type SyncOutcome,
  type SyncReason,
} from '../../domain';
import type { Connectivity } from '../../sync/connectivity';
import type { SyncEngine } from '../../sync/syncEngine';
import type { CacheUsage, ImageCache } from '../images/imageCache';
import type { LocalStore } from '../local/localStore';

export type FeedStatus =
  /** Nunca sincronizou e não há nada em cache: é o único caso de spinner. */
  | 'cold-loading'
  /** Cache frio + sem rede: estado vazio explicativo, não erro. */
  | 'cold-empty'
  /** Há dado local para pintar, esteja online ou não. */
  | 'ready';

export interface FeedSnapshot {
  items: FeedItem[];
  status: FeedStatus;
  /** "atualizado há 3 min" / "nunca sincronizado". */
  lastSyncLabel: string;
  lastSuccessAt: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  /** Escritas ainda não confirmadas pelo servidor. Alimenta o badge de pendência. */
  pendingWrites: number;
  /** Escritas que desistiram após o teto de tentativas. */
  deadWrites: number;
}

export interface Diagnostics {
  cache: CacheUsage;
  cacheEntries: CacheEntry[];
  outbox: OutboxEntry[];
  pendingWrites: number;
  deadWrites: number;
  cursor: string | null;
  lastSuccessAt: string | null;
  postCount: number;
  isOnline: boolean;
  isForcedOffline: boolean;
  isSyncing: boolean;
}

export interface FeedRepositoryDeps {
  store: LocalStore;
  images: ImageCache;
  sync: SyncEngine;
  connectivity: Connectivity;
  now?: () => number;
  newId?: () => string;
}

export class FeedRepository {
  private readonly store: LocalStore;
  private readonly images: ImageCache;
  private readonly syncEngine: SyncEngine;
  private readonly connectivity: Connectivity;
  private readonly now: () => number;
  private readonly newId: () => string;

  private listeners = new Set<() => void>();
  private hasSyncedOnce = false;

  constructor(deps: FeedRepositoryDeps) {
    this.store = deps.store;
    this.images = deps.images;
    this.syncEngine = deps.sync;
    this.connectivity = deps.connectivity;
    this.now = deps.now ?? (() => Date.now());
    this.newId = deps.newId ?? defaultId;

    // Qualquer mudança nessas fontes reemite o snapshot para a UI.
    this.images.subscribe(() => this.emit());
    this.syncEngine.subscribe(() => this.emit());
    this.connectivity.subscribe(() => this.emit());
  }

  /** Abertura do app: prepara o cache, expira o que venceu e revalida. */
  async bootstrap(): Promise<void> {
    await this.images.init();
    await this.pruneExpired();
    this.emit();
    void this.sync('app-start');
  }

  async getSnapshot(): Promise<FeedSnapshot> {
    const [posts, outbox, state] = await Promise.all([
      this.store.listPosts(),
      this.store.listOutbox(),
      this.store.getSyncState(FEED_SYNC_KEY),
    ]);

    const nowMs = this.now();
    const thumbUris = new Map<string, string>();
    for (const post of posts) {
      const uri = this.images.getLocalUri(post.id);
      if (uri !== null) thumbUris.set(post.id, uri);
    }

    const items = composeFeed({
      posts,
      outbox,
      thumbUris,
      nowMs,
      ttlMs: TTL_MS,
      maxPosts: MAX_POSTS,
    });

    // LRU: o que está sendo exibido acaba de ser acessado.
    this.images.touch(items.map((item) => item.id));

    return {
      items,
      status: this.statusFor(items.length, state?.lastSuccessAt ?? null),
      lastSyncLabel: formatLastSync(state?.lastSuccessAt ?? null, nowMs),
      lastSuccessAt: state?.lastSuccessAt ?? null,
      isOnline: this.connectivity.isOnline,
      isSyncing: this.syncEngine.isSyncing,
      pendingWrites: outbox.filter((entry) => entry.status === 'pending').length,
      deadWrites: outbox.filter((entry) => entry.status === 'dead').length,
    };
  }

  /**
   * Assina o feed. Emite o local na hora, revalida em seguida.
   * Devolve a função de cancelamento.
   */
  observeFeed(listener: (snapshot: FeedSnapshot) => void): () => void {
    let active = true;

    const push = (): void => {
      void this.getSnapshot().then((snapshot) => {
        if (active) listener(snapshot);
      });
    };

    this.listeners.add(push);
    push(); // 1ª pintura: banco local, sem esperar rede
    void this.sync('foreground'); // revalidação; o emit dela dispara a 2ª pintura

    return () => {
      active = false;
      this.listeners.delete(push);
    };
  }

  /**
   * Curtida otimista: grava local, devolve na hora, tenta enviar depois.
   * Nunca aguarda a rede.
   */
  async toggleLike(postId: string): Promise<void> {
    const [posts, outbox] = await Promise.all([this.store.listPosts(), this.store.listOutbox()]);
    const post = posts.find((candidate) => candidate.id === postId);
    if (!post) return;

    const forPost = outbox.filter((entry) => entry.entityId === postId);
    const visible = deriveLikeState(post, forPost);
    const kind = nextLikeAction(visible);

    const plan = planEnqueue(forPost, {
      id: this.newId(),
      entityId: postId,
      kind,
      createdAt: new Date(this.now()).toISOString(),
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      status: 'pending',
    });

    if (plan.deleteIds.length > 0) await this.store.deleteOutbox(plan.deleteIds);
    if (plan.insert !== null) await this.store.insertOutbox(plan.insert);

    this.emit();
    void this.sync('manual'); // não aguardado: a UI já reagiu
  }

  async sync(reason: SyncReason): Promise<SyncOutcome> {
    if (!this.connectivity.isOnline) {
      return {
        ok: false,
        reason,
        pulled: 0,
        deleted: 0,
        pushed: 0,
        failed: 0,
        error: 'offline',
        skipped: false,
      };
    }

    const outcome = await this.syncEngine.sync(reason);
    if (outcome.ok) this.hasSyncedOnce = true;
    this.emit();
    return outcome;
  }

  async diagnostics(): Promise<Diagnostics> {
    const [posts, outbox, state] = await Promise.all([
      this.store.listPosts(),
      this.store.listOutbox(),
      this.store.getSyncState(FEED_SYNC_KEY),
    ]);

    return {
      cache: this.images.usage(),
      cacheEntries: this.images.entries(),
      outbox,
      pendingWrites: outbox.filter((entry) => entry.status === 'pending').length,
      deadWrites: outbox.filter((entry) => entry.status === 'dead').length,
      cursor: state?.cursor ?? null,
      lastSuccessAt: state?.lastSuccessAt ?? null,
      postCount: posts.length,
      isOnline: this.connectivity.isOnline,
      isForcedOffline: this.connectivity.isForcedOffline,
      isSyncing: this.syncEngine.isSyncing,
    };
  }

  setForcedOffline(offline: boolean): void {
    this.connectivity.setForcedOffline(offline);
  }

  async clearImageCache(): Promise<void> {
    await this.images.clear();
    this.emit();
  }

  /** Apaga tudo: usado na tela de debug para demonstrar o cache frio. */
  async clearAll(): Promise<void> {
    await this.store.reset();
    await this.images.clear();
    this.hasSyncedOnce = false;
    this.emit();
  }

  /** Baixa os thumbnails que faltam para os posts visíveis. */
  async warmImages(): Promise<void> {
    const posts = await this.store.listPosts();
    const nowMs = this.now();
    const visible = posts.filter((post) => !isExpired(post, nowMs, TTL_MS));
    await this.images.ensure(visible.map((post) => ({ key: post.id, url: post.thumbUrl })));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * TTL vencido: o post sai do banco e o binário sai do disco.
   * Roda na abertura porque, offline, não há sync que faça essa limpeza.
   */
  private async pruneExpired(): Promise<void> {
    const posts = await this.store.listPosts();
    const nowMs = this.now();
    const expired = posts.filter((post: Post) => isExpired(post, nowMs, TTL_MS));
    if (expired.length === 0) return;

    const ids = expired.map((post) => post.id);
    await this.store.applyMerge([], ids);
    await this.images.drop(ids);
  }

  private statusFor(itemCount: number, lastSuccessAt: string | null): FeedStatus {
    if (itemCount > 0) return 'ready';
    if (lastSuccessAt !== null || this.hasSyncedOnce) return 'cold-empty';
    return this.connectivity.isOnline && this.syncEngine.isSyncing ? 'cold-loading' : 'cold-empty';
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}


let counter = 0;
function defaultId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
