import { describe, expect, it } from 'vitest';

import { MAX_POSTS, TTL_MS } from '../../config';
import { composeFeed, formatLastSync } from '../feed';
import { planEnqueue } from '../outbox';
import { iso, makeEntry, makePost, T0 } from './factories';

const DAY = 24 * 60 * 60 * 1000;

describe('composeFeed', () => {
  const base = { nowMs: T0 + 1000, ttlMs: TTL_MS, maxPosts: MAX_POSTS };

  it('junta post, curtida pendente e thumbnail em um item pronto para render', () => {
    const items = composeFeed({
      ...base,
      posts: [makePost({ id: 'p1', likesCount: 4 })],
      outbox: [makeEntry({ id: 'o1', entityId: 'p1', kind: 'like' })],
      thumbUris: new Map([['p1', 'file:///thumbs/p1.jpg']]),
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: 'p1',
        likesCount: 5,
        likedByMe: true,
        hasPendingWrite: true,
        thumbUri: 'file:///thumbs/p1.jpg',
      }),
    ]);
  });

  it('imagem evictada vira thumbUri nulo — o post continua no feed', () => {
    const items = composeFeed({
      ...base,
      posts: [makePost({ id: 'p1' })],
      outbox: [],
      thumbUris: new Map(),
    });

    expect(items[0]?.thumbUri).toBeNull();
    expect(items[0]?.thumbUrl).toContain('p1');
  });

  it('esconde deletados e vencidos, ordena por data e corta em maxPosts', () => {
    const items = composeFeed({
      ...base,
      nowMs: T0 + 8 * DAY,
      maxPosts: 2,
      posts: [
        makePost({ id: 'novo', createdAt: iso(T0 + 3000), cachedAt: iso(T0 + 8 * DAY) }),
        makePost({ id: 'medio', createdAt: iso(T0 + 2000), cachedAt: iso(T0 + 8 * DAY) }),
        makePost({ id: 'antigo', createdAt: iso(T0 + 1000), cachedAt: iso(T0 + 8 * DAY) }),
        makePost({ id: 'deletado', createdAt: iso(T0 + 9000), deletedAt: iso(T0) }),
        makePost({ id: 'vencido', createdAt: iso(T0 + 9000), cachedAt: iso(T0) }),
      ],
      outbox: [],
      thumbUris: new Map(),
    });

    expect(items.map((item) => item.id)).toEqual(['novo', 'medio']);
  });

  it('escrita morta não deixa badge de pendência aceso', () => {
    const items = composeFeed({
      ...base,
      posts: [makePost({ id: 'p1', likesCount: 4 })],
      outbox: [makeEntry({ id: 'o1', entityId: 'p1', status: 'dead', attempts: 5 })],
      thumbUris: new Map(),
    });

    expect(items[0]).toMatchObject({ likesCount: 4, likedByMe: false, hasPendingWrite: false });
  });
});

describe('formatLastSync', () => {
  it('descreve a idade do dado em linguagem humana', () => {
    expect(formatLastSync(null, T0)).toBe('nunca sincronizado');
    expect(formatLastSync(iso(T0), T0 + 10_000)).toBe('atualizado agora');
    expect(formatLastSync(iso(T0), T0 + 5 * 60_000)).toBe('atualizado há 5 min');
    expect(formatLastSync(iso(T0), T0 + 3 * 3_600_000)).toBe('atualizado há 3 h');
    expect(formatLastSync(iso(T0), T0 + 2 * DAY)).toBe('atualizado há 2 d');
  });
});

describe('planEnqueue', () => {
  const next = makeEntry({ id: 'novo', kind: 'unlike', createdAt: iso(T0 + 5000) });

  it('sem nada pendente, enfileira normalmente', () => {
    expect(planEnqueue([], next)).toEqual({ insert: next, deleteIds: [] });
  });

  it('anula a escrita oposta que ainda não saiu — zero requisição', () => {
    const pending = makeEntry({ id: 'o1', kind: 'like', attempts: 0 });
    expect(planEnqueue([pending], next)).toEqual({ insert: null, deleteIds: ['o1'] });
  });

  it('não anula escrita já tentada: o servidor pode tê-la recebido', () => {
    const attempted = makeEntry({ id: 'o1', kind: 'like', attempts: 1, lastAttemptAt: T0 });
    expect(planEnqueue([attempted], next)).toEqual({ insert: next, deleteIds: [] });
  });

  it('não anula contra entrada morta', () => {
    const dead = makeEntry({ id: 'o1', kind: 'like', status: 'dead', attempts: 5 });
    expect(planEnqueue([dead], next)).toEqual({ insert: next, deleteIds: [] });
  });
});
