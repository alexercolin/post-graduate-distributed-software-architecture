/**
 * Teste de integração do repositório + sync engine, rodando em Node.
 *
 * Substitui só as bordas de I/O (SQLite -> memória, FileSystem -> memória). O
 * servidor fake, o domínio, o SyncEngine e o FeedRepository são os de produção.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { CACHE_BUDGET_BYTES, MAX_POSTS, TTL_MS } from '../../config';
import type { Post } from '../../domain';
import { Connectivity } from '../../sync/connectivity';
import { SyncEngine } from '../../sync/syncEngine';
import { InMemoryImageCache } from '../images/inMemoryImageCache';
import { InMemoryLocalStore } from '../local/inMemoryLocalStore';
import { MockServer } from '../remote/mockServer';
import { MockRemoteDataSource } from '../remote/remoteDataSource';
import { FeedRepository } from './feedRepository';

const THUMB_BYTES = 64 * 1024;

interface Harness {
  repository: FeedRepository;
  store: InMemoryLocalStore;
  images: InMemoryImageCache;
  server: MockServer;
  connectivity: Connectivity;
  setNow: (ms: number) => void;
}

function makeHarness(options: { seed?: Post[]; budgetBytes?: number; seedCount?: number } = {}): Harness {
  let nowMs = Date.parse('2026-02-01T10:00:00.000Z');
  const now = (): number => nowMs;

  const store = new InMemoryLocalStore(options.seed ?? []);
  const images = new InMemoryImageCache(options.budgetBytes ?? CACHE_BUDGET_BYTES, THUMB_BYTES);
  const server = new MockServer({ seedCount: options.seedCount ?? 24, now: nowMs });
  server.setLatency(0);

  const connectivity = new Connectivity();
  const sync = new SyncEngine({ store, remote: new MockRemoteDataSource(server), images, now });

  let counter = 0;
  const repository = new FeedRepository({
    store,
    images,
    sync,
    connectivity,
    now,
    newId: () => `outbox-${++counter}`,
  });

  return {
    repository,
    store,
    images,
    server,
    connectivity,
    setNow: (ms: number) => {
      nowMs = ms;
    },
  };
}

describe('cenário 1 — cache frio + online', () => {
  it('sai do vazio, sincroniza e passa a ter os 20 posts com thumbnail', async () => {
    const harness = makeHarness();

    const before = await harness.repository.getSnapshot();
    expect(before.items).toHaveLength(0);
    expect(before.status).toBe('cold-empty');
    expect(before.lastSyncLabel).toBe('nunca sincronizado');

    const outcome = await harness.repository.sync('app-start');
    expect(outcome.ok).toBe(true);
    expect(outcome.pulled).toBeGreaterThan(MAX_POSTS);

    const after = await harness.repository.getSnapshot();
    // O servidor tem 24 posts; o RNF diz 20. O trim é do cliente.
    expect(after.items).toHaveLength(MAX_POSTS);
    expect(after.status).toBe('ready');
    expect(after.lastSyncLabel).toBe('atualizado agora');
    expect(after.items.every((item) => item.thumbUri !== null)).toBe(true);
  });
});

describe('cenário 2 — cache quente + online', () => {
  it('emite o local antes da revalidação e emite de novo depois (stale-while-revalidate)', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    harness.server.setLatency(30);

    // O servidor muda; o cliente ainda não sabe.
    harness.server.publishPost({ id: 'post-novo', caption: 'chegou depois' });

    const emissions: number[] = [];
    const captions: string[][] = [];
    const unsubscribe = harness.repository.observeFeed((snapshot) => {
      emissions.push(snapshot.items.length);
      captions.push(snapshot.items.map((item) => item.caption));
    });

    await waitFor(() => captions.some((list) => list.includes('chegou depois')));
    unsubscribe();

    // Primeira emissão: instantânea, do banco local, sem o post novo.
    expect(emissions[0]).toBe(MAX_POSTS);
    expect(captions[0]).not.toContain('chegou depois');
    // Última: já revalidada.
    expect(captions.at(-1)).toContain('chegou depois');
  });
});

describe('cenário 3 — cache quente + offline', () => {
  it('renderiza os 20 posts sem rede, com o timestamp da última sync', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);

    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.items).toHaveLength(MAX_POSTS);
    expect(snapshot.status).toBe('ready');
    expect(snapshot.isOnline).toBe(false);
    expect(snapshot.lastSuccessAt).not.toBeNull();

    // Tentar sincronizar offline não quebra nem apaga nada.
    const outcome = await harness.repository.sync('manual');
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toBe('offline');
    expect((await harness.repository.getSnapshot()).items).toHaveLength(MAX_POSTS);
  });

  it('cache frio + offline devolve estado vazio explicativo, não erro', async () => {
    const harness = makeHarness();
    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);

    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.status).toBe('cold-empty');
    expect(snapshot.items).toEqual([]);
  });
});

describe('curtida offline e drenagem do outbox', () => {
  it('incrementa na hora, entra no outbox e reconcilia quando a rede volta', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');

    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');
    const before = target.likesCount;

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    await harness.repository.toggleLike(target.id);

    const optimistic = await harness.repository.getSnapshot();
    const liked = optimistic.items.find((item) => item.id === target.id);
    expect(liked?.likesCount).toBe(before + 1);
    expect(liked?.likedByMe).toBe(true);
    expect(liked?.hasPendingWrite).toBe(true);
    expect(optimistic.pendingWrites).toBe(1);

    harness.repository.setForcedOffline(false);
    harness.server.setOffline(false);
    const outcome = await harness.repository.sync('connectivity-restored');

    expect(outcome.pushed).toBe(1);
    const reconciled = await harness.repository.getSnapshot();
    const item = reconciled.items.find((entry) => entry.id === target.id);
    expect(item?.likesCount).toBe(before + 1);
    expect(item?.hasPendingWrite).toBe(false);
    expect(reconciled.pendingWrites).toBe(0);
    expect(harness.server.peek(target.id)?.likesCount).toBe(before + 1);
  });

  it('reenvio da mesma curtida não dobra o contador (idempotência)', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');
    const before = target.likesCount;

    await harness.repository.toggleLike(target.id);
    await harness.repository.sync('manual');
    // Simula "a resposta se perdeu": o cliente reenvia a mesma escrita.
    await harness.repository.sync('manual');
    await harness.repository.sync('manual');

    expect(harness.server.peek(target.id)?.likesCount).toBe(before + 1);
  });

  it('curtir e descurtir offline se anulam antes de virar requisição', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    await harness.repository.toggleLike(target.id);
    await harness.repository.toggleLike(target.id);

    expect(await harness.store.listOutbox()).toHaveLength(0);
    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.pendingWrites).toBe(0);
    expect(snapshot.items.find((item) => item.id === target.id)?.likesCount).toBe(
      target.likesCount,
    );
  });

  it('a pendência sobrevive ao fechamento do app (o outbox está no banco)', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    await harness.repository.toggleLike(target.id);

    // "Matar o app": novo repositório sobre o MESMO store, mesmo relógio.
    const now = (): number => Date.parse('2026-02-01T10:00:00.000Z');
    const reopened = new FeedRepository({
      store: harness.store,
      images: harness.images,
      sync: new SyncEngine({
        store: harness.store,
        remote: new MockRemoteDataSource(harness.server),
        images: harness.images,
        now,
      }),
      connectivity: new Connectivity(),
      now,
    });

    const snapshot = await reopened.getSnapshot();
    expect(snapshot.pendingWrites).toBe(1);
    expect(snapshot.items.find((item) => item.id === target.id)?.likedByMe).toBe(true);
  });

  it('erro do servidor consome tentativa e mantém a entrada pendente', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');

    // Enfileira offline para que o push automático da curtida não drene antes
    // de ligarmos a falha do servidor.
    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    await harness.repository.toggleLike(target.id);

    harness.repository.setForcedOffline(false);
    harness.server.setOffline(false);
    harness.server.setErrorRate(1);
    const outcome = await harness.repository.sync('manual');

    expect(outcome.failed).toBe(1);
    const [entry] = await harness.store.listOutbox();
    expect(entry?.attempts).toBe(1);
    expect(entry?.status).toBe('pending');
    expect(entry?.lastError).toContain('500');
  });
});

describe('tombstones', () => {
  it('post deletado no servidor some do feed local e leva o thumbnail junto', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');

    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');
    expect(harness.images.getLocalUri(target.id)).not.toBeNull();

    expect(harness.server.deletePost(target.id)).toBe(true);
    const outcome = await harness.repository.sync('manual');

    expect(outcome.deleted).toBe(1);
    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.items.find((item) => item.id === target.id)).toBeUndefined();
    expect(harness.images.getLocalUri(target.id)).toBeNull();
  });

  it('curtida pendente de post deletado é descartada em vez de tentar para sempre', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    const target = (await harness.repository.getSnapshot()).items[0];
    if (!target) throw new Error('feed vazio');

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    await harness.repository.toggleLike(target.id);
    expect(await harness.store.listOutbox()).toHaveLength(1);

    harness.server.setOffline(false);
    harness.repository.setForcedOffline(false);
    harness.server.deletePost(target.id);
    // Primeira sync: o push falha com 404 e o pull aplica o tombstone.
    await harness.repository.sync('manual');
    await harness.repository.sync('manual');

    expect(await harness.store.listOutbox()).toHaveLength(0);
  });
});

describe('budget de imagens', () => {
  it('estourar o budget evicta os menos usados e mantém o uso sob o teto', async () => {
    const budget = 5 * THUMB_BYTES;
    const harness = makeHarness({ budgetBytes: budget });

    await harness.repository.sync('app-start');
    const usage = harness.images.usage();

    expect(usage.bytes).toBeLessThanOrEqual(budget);
    expect(usage.count).toBeLessThanOrEqual(5);

    // Os posts sem thumbnail continuam no feed, com placeholder.
    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.items).toHaveLength(MAX_POSTS);
    expect(snapshot.items.some((item) => item.thumbUri === null)).toBe(true);
  });
});

describe('TTL de 7 dias', () => {
  it('depois de 7 dias sem sync o feed offline fica vazio, por design', async () => {
    const harness = makeHarness();
    await harness.repository.sync('app-start');
    expect((await harness.repository.getSnapshot()).items).toHaveLength(MAX_POSTS);

    harness.repository.setForcedOffline(true);
    harness.server.setOffline(true);
    harness.setNow(Date.parse('2026-02-01T10:00:00.000Z') + TTL_MS + 1);

    const snapshot = await harness.repository.getSnapshot();
    expect(snapshot.items).toEqual([]);
    expect(snapshot.status).toBe('cold-empty');
  });
});

describe('execução única do sync', () => {
  it('duas syncs simultâneas não se sobrepõem — a segunda é descartada', async () => {
    const harness = makeHarness();
    harness.server.setLatency(40);

    const [first, second] = await Promise.all([
      harness.repository.sync('foreground'),
      harness.repository.sync('connectivity-restored'),
    ]);

    expect([first.skipped, second.skipped].filter(Boolean)).toHaveLength(1);
    expect((await harness.repository.getSnapshot()).items).toHaveLength(MAX_POSTS);
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timeout esperando condição');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
