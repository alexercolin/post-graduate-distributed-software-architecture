import { describe, expect, it } from 'vitest';

import { TTL_MS } from '../../config';
import { deriveLikeState, isExpired, mergeDelta, nextLikeAction, visiblePosts } from '../post';
import { iso, makeEntry, makePost, makeRemotePost, T0 } from './factories';

const DAY = 24 * 60 * 60 * 1000;

describe('deriveLikeState', () => {
  it('devolve o estado do servidor quando não há nada pendente', () => {
    const view = deriveLikeState({ likesCount: 10, likedByMe: false }, []);
    expect(view).toEqual({ likesCount: 10, likedByMe: false, pendingCount: 0 });
  });

  it('sobrepõe o servidor com a curtida pendente', () => {
    const view = deriveLikeState(
      { likesCount: 10, likedByMe: false },
      [makeEntry({ id: 'o1', kind: 'like' })],
    );
    expect(view).toEqual({ likesCount: 11, likedByMe: true, pendingCount: 1 });
  });

  it('aplica like seguido de unlike na ordem de criação e volta ao estado inicial', () => {
    const view = deriveLikeState({ likesCount: 10, likedByMe: false }, [
      makeEntry({ id: 'o2', kind: 'unlike', createdAt: iso(T0 + 2000) }),
      makeEntry({ id: 'o1', kind: 'like', createdAt: iso(T0 + 1000) }),
    ]);
    expect(view).toEqual({ likesCount: 10, likedByMe: false, pendingCount: 2 });
  });

  it('é idempotente: curtir o que o servidor já diz curtido não move o contador', () => {
    const view = deriveLikeState(
      { likesCount: 10, likedByMe: true },
      [makeEntry({ id: 'o1', kind: 'like' })],
    );
    expect(view).toEqual({ likesCount: 10, likedByMe: true, pendingCount: 1 });
  });

  it('ignora entradas mortas — o estado otimista é revertido, não perpetuado', () => {
    const view = deriveLikeState({ likesCount: 10, likedByMe: false }, [
      makeEntry({ id: 'o1', kind: 'like', status: 'dead', attempts: 5 }),
    ]);
    expect(view).toEqual({ likesCount: 10, likedByMe: false, pendingCount: 0 });
  });

  it('nunca produz contador negativo', () => {
    const view = deriveLikeState(
      { likesCount: 0, likedByMe: true },
      [makeEntry({ id: 'o1', kind: 'unlike' })],
    );
    expect(view.likesCount).toBe(0);
  });

  it('nextLikeAction segue o estado visível, não o do servidor', () => {
    expect(nextLikeAction({ likedByMe: false })).toBe('like');
    expect(nextLikeAction({ likedByMe: true })).toBe('unlike');
  });
});

describe('mergeDelta', () => {
  const maxPosts = 20;

  it('delta vazio preserva o estado local e só renova a validade', () => {
    const local = [makePost({ id: 'p1', cachedAt: iso(T0) })];
    const result = mergeDelta({
      local,
      incoming: [],
      deletedIds: [],
      now: iso(T0 + DAY),
      maxPosts,
    });

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]?.id).toBe('p1');
    expect(result.posts[0]?.cachedAt).toBe(iso(T0 + DAY));
    expect(result.droppedIds).toEqual([]);
  });

  it('insere post novo e atualiza post existente', () => {
    const local = [makePost({ id: 'p1', caption: 'antigo', updatedAt: iso(T0) })];
    const result = mergeDelta({
      local,
      incoming: [
        makeRemotePost({ id: 'p1', caption: 'novo', updatedAt: iso(T0 + 1000) }),
        makeRemotePost({ id: 'p2', createdAt: iso(T0 + 5000) }),
      ],
      deletedIds: [],
      now: iso(T0 + 9000),
      maxPosts,
    });

    expect(result.posts.map((post) => post.id)).toEqual(['p2', 'p1']);
    expect(result.posts.find((post) => post.id === 'p1')?.caption).toBe('novo');
  });

  it('ignora resposta atrasada mais velha que o local (last-write-wins)', () => {
    const local = [makePost({ id: 'p1', caption: 'novo', updatedAt: iso(T0 + 5000) })];
    const result = mergeDelta({
      local,
      incoming: [makeRemotePost({ id: 'p1', caption: 'velho', updatedAt: iso(T0) })],
      deletedIds: [],
      now: iso(T0 + 9000),
      maxPosts,
    });

    expect(result.posts[0]?.caption).toBe('novo');
  });

  it('tombstone remove o post do estado local e o reporta como dropped', () => {
    const local = [makePost({ id: 'p1' }), makePost({ id: 'p2' })];
    const result = mergeDelta({
      local,
      incoming: [],
      deletedIds: ['p1'],
      now: iso(T0 + 1000),
      maxPosts,
    });

    expect(result.posts.map((post) => post.id)).toEqual(['p2']);
    expect(result.droppedIds).toEqual(['p1']);
  });

  it('tombstone vence mesmo se o post vier no mesmo delta', () => {
    const result = mergeDelta({
      local: [],
      incoming: [makeRemotePost({ id: 'p1' })],
      deletedIds: ['p1'],
      now: iso(T0),
      maxPosts,
    });

    expect(result.posts).toEqual([]);
  });

  it('corta em maxPosts mantendo os mais recentes e reporta os cortados', () => {
    const local = Array.from({ length: 5 }, (_unused, index) =>
      makePost({ id: `p${index}`, createdAt: iso(T0 + index * 1000) }),
    );
    const result = mergeDelta({
      local,
      incoming: [],
      deletedIds: [],
      now: iso(T0 + 10_000),
      maxPosts: 3,
    });

    expect(result.posts.map((post) => post.id)).toEqual(['p4', 'p3', 'p2']);
    expect(result.droppedIds.sort()).toEqual(['p0', 'p1']);
  });

  it('descarta posts locais já marcados como deletados', () => {
    const result = mergeDelta({
      local: [makePost({ id: 'p1', deletedAt: iso(T0) })],
      incoming: [],
      deletedIds: [],
      now: iso(T0 + 1000),
      maxPosts,
    });

    expect(result.posts).toEqual([]);
    expect(result.droppedIds).toEqual(['p1']);
  });
});

describe('TTL de 7 dias', () => {
  it('post confirmado há menos de 7 dias continua visível', () => {
    const post = makePost({ id: 'p1', cachedAt: iso(T0) });
    expect(isExpired(post, T0 + 6 * DAY, TTL_MS)).toBe(false);
  });

  it('post confirmado há mais de 7 dias sai do feed, por design', () => {
    const post = makePost({ id: 'p1', cachedAt: iso(T0) });
    expect(isExpired(post, T0 + 7 * DAY + 1, TTL_MS)).toBe(true);
    expect(visiblePosts([post], T0 + 8 * DAY, TTL_MS)).toEqual([]);
  });

  it('exatamente no limite ainda é válido', () => {
    const post = makePost({ id: 'p1', cachedAt: iso(T0) });
    expect(isExpired(post, T0 + 7 * DAY, TTL_MS)).toBe(false);
  });
});
