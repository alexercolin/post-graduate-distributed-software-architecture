/**
 * Implementação do `LocalStore` sobre expo-sqlite + Drizzle.
 *
 * Além da porta, expõe `feedQuery()` e `outboxQuery()`: objetos de query que o
 * `useLiveQuery` observa para a UI reagir a mudanças no banco sem polling.
 */

import { and, desc, eq, gte, inArray, isNull } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { FEED_SYNC_KEY, MAX_POSTS } from '../../config';
import type { OutboxEntry, Post, PostId, SyncState } from '../../domain';
import { expiryCutoff } from '../../domain';
import type { LocalStore } from './localStore';
import { outbox, posts, syncState, type schema } from './schema';

type Database = ExpoSQLiteDatabase<typeof schema>;

type PostRow = typeof posts.$inferSelect;
type OutboxRow = typeof outbox.$inferSelect;

export function toPost(row: PostRow): Post {
  return {
    id: row.id,
    author: row.author,
    caption: row.caption,
    imageUrl: row.imageUrl,
    thumbUrl: row.thumbUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    likesCount: row.likesCount,
    likedByMe: row.likedByMe,
    cachedAt: row.cachedAt,
  };
}

export function toOutboxEntry(row: OutboxRow): OutboxEntry {
  return {
    id: row.id,
    entityId: row.entityId,
    kind: row.kind,
    createdAt: row.createdAt,
    attempts: row.attempts,
    lastAttemptAt: row.lastAttemptAt,
    lastError: row.lastError,
    status: row.status,
  };
}

export class DrizzleLocalStore implements LocalStore {
  constructor(private readonly db: Database) {}

  /**
   * Query reativa do feed. O filtro de TTL entra como corte de `cached_at` para
   * que a expiração aconteça no banco — a lista nem chega à UI já vencida.
   */
  feedQuery(nowMs: number, ttlMs: number) {
    return this.db
      .select()
      .from(posts)
      .where(and(isNull(posts.deletedAt), gte(posts.cachedAt, expiryCutoff(nowMs, ttlMs))))
      .orderBy(desc(posts.createdAt))
      .limit(MAX_POSTS);
  }

  outboxQuery() {
    return this.db.select().from(outbox);
  }

  syncStateQuery() {
    return this.db.select().from(syncState).where(eq(syncState.key, FEED_SYNC_KEY)).limit(1);
  }

  async listPosts(): Promise<Post[]> {
    const rows = await this.db.select().from(posts);
    return rows.map(toPost);
  }

  async applyMerge(next: readonly Post[], droppedIds: readonly PostId[]): Promise<void> {
    this.db.transaction((tx) => {
      if (droppedIds.length > 0) {
        tx.delete(posts).where(inArray(posts.id, [...droppedIds])).run();
      }
      for (const post of next) {
        tx.insert(posts)
          .values(post)
          .onConflictDoUpdate({ target: posts.id, set: post })
          .run();
      }
    });
  }

  async applyServerLike(postId: PostId, likesCount: number, likedByMe: boolean): Promise<void> {
    await this.db.update(posts).set({ likesCount, likedByMe }).where(eq(posts.id, postId));
  }

  async listOutbox(): Promise<OutboxEntry[]> {
    const rows = await this.db.select().from(outbox);
    return rows.map(toOutboxEntry);
  }

  async insertOutbox(entry: OutboxEntry): Promise<void> {
    await this.db.insert(outbox).values(entry);
  }

  async updateOutbox(entry: OutboxEntry): Promise<void> {
    await this.db.update(outbox).set(entry).where(eq(outbox.id, entry.id));
  }

  async deleteOutbox(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.delete(outbox).where(inArray(outbox.id, [...ids]));
  }

  async getSyncState(key: string): Promise<SyncState | null> {
    const rows = await this.db.select().from(syncState).where(eq(syncState.key, key)).limit(1);
    return rows[0] ?? null;
  }

  async setSyncState(state: SyncState): Promise<void> {
    await this.db
      .insert(syncState)
      .values(state)
      .onConflictDoUpdate({ target: syncState.key, set: state });
  }

  async reset(): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(posts).run();
      tx.delete(outbox).run();
      tx.delete(syncState).run();
    });
  }
}
