/**
 * Composição do que a UI renderiza. Pura: recebe as três fontes já lidas
 * (posts locais, outbox, mapa de thumbnails em disco) e devolve a lista final.
 *
 * Manter isto no domínio é o que permite testar "cache quente + curtida pendente
 * + imagem evictada" sem banco, sem disco e sem emulador.
 */

import type { OutboxEntry } from './outbox';
import { deriveLikeState, visiblePosts, type Post, type PostId } from './post';

export interface FeedItem {
  id: PostId;
  author: string;
  caption: string;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
  /** Há escrita não confirmada para este post: a UI mostra o badge de pendência. */
  hasPendingWrite: boolean;
  /** URI local do thumbnail. `null` = evictado ou ainda não baixado → placeholder. */
  thumbUri: string | null;
  /** URL remota, para o cache tentar baixar depois. */
  thumbUrl: string;
}

export interface ComposeFeedInput {
  posts: readonly Post[];
  outbox: readonly OutboxEntry[];
  /** postId -> uri local do arquivo, quando existe em disco. */
  thumbUris: ReadonlyMap<PostId, string>;
  nowMs: number;
  ttlMs: number;
  maxPosts: number;
}

export function composeFeed(input: ComposeFeedInput): FeedItem[] {
  const { posts, outbox, thumbUris, nowMs, ttlMs, maxPosts } = input;

  const byPost = new Map<PostId, OutboxEntry[]>();
  for (const entry of outbox) {
    const list = byPost.get(entry.entityId);
    if (list) list.push(entry);
    else byPost.set(entry.entityId, [entry]);
  }

  return visiblePosts(posts, nowMs, ttlMs)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, maxPosts)
    .map((post) => {
      const entries = byPost.get(post.id) ?? [];
      const like = deriveLikeState(post, entries);
      return {
        id: post.id,
        author: post.author,
        caption: post.caption,
        createdAt: post.createdAt,
        likesCount: like.likesCount,
        likedByMe: like.likedByMe,
        hasPendingWrite: like.pendingCount > 0,
        thumbUri: thumbUris.get(post.id) ?? null,
        thumbUrl: post.thumbUrl,
      };
    });
}

/** Rótulo honesto de quão velho é o dado na tela. */
export function formatLastSync(lastSuccessAt: string | null, nowMs: number): string {
  if (lastSuccessAt === null) return 'nunca sincronizado';

  const deltaMs = nowMs - Date.parse(lastSuccessAt);
  if (Number.isNaN(deltaMs)) return 'nunca sincronizado';
  if (deltaMs < 60_000) return 'atualizado agora';

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `atualizado há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `atualizado há ${hours} h`;

  const days = Math.floor(hours / 24);
  return `atualizado há ${days} d`;
}
