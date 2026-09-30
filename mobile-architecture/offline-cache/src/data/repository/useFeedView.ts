/**
 * O hook que a UI consome. Mora na camada de dados de propósito: é parte da
 * superfície pública do repositório, não da tela.
 *
 * As três fontes:
 *   - posts e outbox   -> `useLiveQuery` do Drizzle (o SQLite avisa quando muda)
 *   - thumbnails       -> assinatura do ImageCache
 *   - estado de sync   -> assinatura do SyncEngine e do Connectivity
 *
 * Nenhuma delas é polling, e nenhuma delas é rede. A primeira pintura sai do
 * banco local, sempre.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { MAX_POSTS, TTL_MS } from '../../config';
import { composeFeed, formatLastSync } from '../../domain';
import { getContainer } from '../../container';
import { toOutboxEntry, toPost } from '../local/drizzleLocalStore';
import type { FeedSnapshot, FeedStatus } from './feedRepository';

/** De quanto em quanto tempo o rótulo "atualizado há X" é recalculado. */
const CLOCK_TICK_MS = 30_000;

export function useFeedView(): FeedSnapshot {
  const { store, images, connectivity, syncEngine } = getContainer();
  const [, forceRender] = useReducer((value: number) => value + 1, 0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => images.subscribe(forceRender), [images]);
  useEffect(() => connectivity.subscribe(forceRender), [connectivity]);
  useEffect(() => syncEngine.subscribe(forceRender), [syncEngine]);

  const feedQuery = useMemo(() => store.feedQuery(nowMs, TTL_MS), [store, nowMs]);
  const outboxQuery = useMemo(() => store.outboxQuery(), [store]);
  const syncQuery = useMemo(() => store.syncStateQuery(), [store]);

  const { data: postRows } = useLiveQuery(feedQuery, [nowMs]);
  const { data: outboxRows } = useLiveQuery(outboxQuery);
  const { data: syncRows } = useLiveQuery(syncQuery);

  const posts = useMemo(() => (postRows ?? []).map(toPost), [postRows]);
  const outbox = useMemo(() => (outboxRows ?? []).map(toOutboxEntry), [outboxRows]);
  const lastSuccessAt = syncRows?.[0]?.lastSuccessAt ?? null;

  const items = useMemo(() => {
    const thumbUris = new Map<string, string>();
    for (const post of posts) {
      const uri = images.getLocalUri(post.id);
      if (uri !== null) thumbUris.set(post.id, uri);
    }
    return composeFeed({ posts, outbox, thumbUris, nowMs, ttlMs: TTL_MS, maxPosts: MAX_POSTS });
    // `images` muda de conteúdo sem mudar de identidade: o re-render vem da
    // assinatura acima, por isso ele não entra nas dependências.
  }, [posts, outbox, nowMs, images]);

  // Baixa o que falta, uma vez por conjunto de faltantes — sem isso, cada
  // re-render dispararia download de novo.
  const requested = useRef<string>('');
  useEffect(() => {
    const missing = items.filter((item) => item.thumbUri === null);
    const signature = missing.map((item) => item.id).join('|');
    if (signature === '' || signature === requested.current) return;
    requested.current = signature;
    void images.ensure(missing.map((item) => ({ key: item.id, url: item.thumbUrl })));
  }, [items, images]);

  // Acesso para o LRU: o que está na tela é o que foi usado por último.
  useEffect(() => {
    images.touch(items.map((item) => item.id));
  }, [items, images]);

  const pendingWrites = outbox.filter((entry) => entry.status === 'pending').length;

  return {
    items,
    status: resolveStatus(items.length, lastSuccessAt, syncEngine.isSyncing),
    lastSyncLabel: formatLastSync(lastSuccessAt, nowMs),
    lastSuccessAt,
    isOnline: connectivity.isOnline,
    isSyncing: syncEngine.isSyncing,
    pendingWrites,
    deadWrites: outbox.filter((entry) => entry.status === 'dead').length,
  };

  function resolveStatus(
    count: number,
    syncedAt: string | null,
    isSyncing: boolean,
  ): FeedStatus {
    if (count > 0) return 'ready';
    // Spinner só quando não há absolutamente nada em cache e a sync está em curso.
    if (syncedAt === null && isSyncing) return 'cold-loading';
    return 'cold-empty';
  }
}

/** Ações que a UI pode disparar. Repassa para o repositório, nunca para a rede. */
export function useFeedActions() {
  const { repository } = getContainer();
  return useMemo(
    () => ({
      toggleLike: (postId: string) => void repository.toggleLike(postId),
      refresh: () => repository.sync('manual'),
    }),
    [repository],
  );
}
