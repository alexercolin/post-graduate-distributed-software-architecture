import type { OutboxEntry } from '../outbox';
import type { Post, RemotePost } from '../post';

export const T0 = Date.parse('2026-01-10T12:00:00.000Z');
export const iso = (ms: number): string => new Date(ms).toISOString();

export function makePost(overrides: Partial<Post> & { id: string }): Post {
  return {
    author: 'ada',
    caption: 'caption',
    imageUrl: `https://cdn.test/${overrides.id}/full.jpg`,
    thumbUrl: `https://cdn.test/${overrides.id}/thumb.jpg`,
    createdAt: iso(T0),
    updatedAt: iso(T0),
    deletedAt: null,
    likesCount: 0,
    likedByMe: false,
    cachedAt: iso(T0),
    ...overrides,
  };
}

export function makeRemotePost(overrides: Partial<RemotePost> & { id: string }): RemotePost {
  const { deletedAt: _deletedAt, cachedAt: _cachedAt, ...post } = makePost(overrides);
  return { ...post, ...overrides };
}

export function makeEntry(overrides: Partial<OutboxEntry> & { id: string }): OutboxEntry {
  return {
    entityId: 'p1',
    kind: 'like',
    createdAt: iso(T0),
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
    status: 'pending',
    ...overrides,
  };
}
