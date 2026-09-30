import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * O banco local é o Single Source of Truth da UI.
 *
 * Datas são TEXT ISO-8601 UTC de propósito: ordenam lexicograficamente, aparecem
 * legíveis no inspector do SQLite e comparam direto com o cursor do delta sync.
 * trade-off: ocupa mais bytes que INTEGER epoch. Para 20 posts, irrelevante.
 */
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(),
    author: text('author').notNull(),
    caption: text('caption').notNull().default(''),
    imageUrl: text('image_url').notNull(),
    thumbUrl: text('thumb_url').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    /** Tombstone vindo do servidor. */
    deletedAt: text('deleted_at'),
    likesCount: integer('likes_count').notNull().default(0),
    /** Estado do servidor. O visível é derivado no domínio com o outbox. */
    likedByMe: integer('liked_by_me', { mode: 'boolean' }).notNull().default(false),
    /** Última confirmação do servidor. Base do TTL de 7 dias. */
    cachedAt: text('cached_at').notNull(),
  },
  (table) => [
    // O feed é sempre "não deletado, dentro do TTL, mais novos primeiro".
    index('posts_feed_idx').on(table.deletedAt, table.cachedAt, table.createdAt),
  ],
);

export const outbox = sqliteTable(
  'outbox',
  {
    /** Gerado no cliente; viaja como chave de idempotência. */
    id: text('id').primaryKey(),
    entityId: text('entity_id').notNull(),
    kind: text('kind', { enum: ['like', 'unlike'] }).notNull(),
    createdAt: text('created_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    /**
     * Coluna além das descritas no CLAUDE.md: sem ela não há como calcular o
     * backoff (precisamos de "quando foi a última tentativa", não "quando foi
     * criada"). Registrado como extensão consciente do modelo.
     */
    lastAttemptAt: integer('last_attempt_at'),
    lastError: text('last_error'),
    status: text('status', { enum: ['pending', 'dead'] })
      .notNull()
      .default('pending'),
  },
  (table) => [index('outbox_entity_idx').on(table.entityId)],
);

export const syncState = sqliteTable('sync_state', {
  key: text('key').primaryKey(),
  cursor: text('cursor'),
  lastSuccessAt: text('last_success_at'),
});

export const schema = { posts, outbox, syncState };
