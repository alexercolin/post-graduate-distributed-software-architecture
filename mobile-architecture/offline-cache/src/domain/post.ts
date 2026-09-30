/**
 * Post e as duas regras que definem o que o usuário enxerga:
 *
 *  1. `deriveLikeState` — estado do servidor sobreposto pelo outbox pendente.
 *  2. `mergeDelta`      — como o delta sync vira o novo estado local.
 *
 * Camada de domínio: função pura, `now` sempre por parâmetro.
 */

import type { OutboxEntry } from './outbox';

export type PostId = string;
/** ISO 8601 em UTC. Comparável lexicograficamente — é por isso que é string. */
export type IsoDate = string;

/** Como o post existe no banco local. */
export interface Post {
  id: PostId;
  author: string;
  caption: string;
  imageUrl: string;
  thumbUrl: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  /** Tombstone recebido do servidor. Post deletado nunca é exibido. */
  deletedAt: IsoDate | null;
  likesCount: number;
  /** Estado do SERVIDOR. O que a UI mostra é `deriveLikeState`, não isto. */
  likedByMe: boolean;
  /**
   * Quando o servidor confirmou este post pela última vez.
   *
   * Uma sync bem-sucedida confirma todos os posts que não vieram na lista de
   * deletados — por isso `cachedAt` é renovado para todos os sobreviventes, e não
   * só para os que mudaram. Assim o TTL mede "tempo sem contato com o servidor",
   * que é exatamente o que o RNF de 7 dias offline quer dizer.
   */
  cachedAt: IsoDate;
}

/** O post como o servidor devolve: sem tombstone e sem metadado de cache. */
export type RemotePost = Omit<Post, 'deletedAt' | 'cachedAt'>;

// --- 1. estado de curtida visível --------------------------------------------

export interface LikeView {
  likesCount: number;
  likedByMe: boolean;
  /** Quantas escritas ainda não confirmadas existem para este post. */
  pendingCount: number;
}

/**
 * O `liked_by_me` que a UI renderiza = estado do servidor + outbox pendente.
 *
 * Entradas `dead` são ignoradas de propósito: se a escrita não vai mais ser
 * enviada, continuar mostrando o coração aceso seria mentir para o usuário.
 * A UI reverte para o estado do servidor e a tela de debug expõe a falha.
 */
export function deriveLikeState(
  server: Pick<Post, 'likesCount' | 'likedByMe'>,
  entries: readonly OutboxEntry[],
): LikeView {
  let likesCount = server.likesCount;
  let likedByMe = server.likedByMe;
  let pendingCount = 0;

  const ordered = entries
    .filter((entry) => entry.status === 'pending')
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const entry of ordered) {
    pendingCount += 1;
    // Aplicação idempotente: curtir o que já está curtido não move o contador.
    if (entry.kind === 'like' && !likedByMe) {
      likedByMe = true;
      likesCount += 1;
    } else if (entry.kind === 'unlike' && likedByMe) {
      likedByMe = false;
      likesCount = Math.max(0, likesCount - 1);
    }
  }

  return { likesCount, likedByMe, pendingCount };
}

/** O que o próximo toque no botão de curtir deve enfileirar. */
export function nextLikeAction(current: Pick<LikeView, 'likedByMe'>): 'like' | 'unlike' {
  return current.likedByMe ? 'unlike' : 'like';
}

// --- 2. merge do delta sync ---------------------------------------------------

export interface MergeDeltaInput {
  local: readonly Post[];
  incoming: readonly RemotePost[];
  deletedIds: readonly PostId[];
  /** Instante da sync, usado como novo `cachedAt` dos sobreviventes. */
  now: IsoDate;
  maxPosts: number;
}

export interface MergeDeltaResult {
  /** Novo estado local: mais novos primeiro, no máximo `maxPosts`. */
  posts: Post[];
  /**
   * Ids que saíram do estado local — por tombstone ou por trim.
   * O ImageCache usa esta lista para liberar os binários correspondentes.
   */
  droppedIds: PostId[];
}

export function mergeDelta(input: MergeDeltaInput): MergeDeltaResult {
  const { local, incoming, deletedIds, now, maxPosts } = input;
  const tombstoned = new Set(deletedIds);
  const byId = new Map<PostId, Post>();

  for (const post of local) {
    if (post.deletedAt === null) byId.set(post.id, post);
  }

  for (const remote of incoming) {
    if (tombstoned.has(remote.id)) continue;
    const existing = byId.get(remote.id);
    // Last-write-wins por updatedAt: uma resposta atrasada não rebaixa o local.
    if (existing && existing.updatedAt > remote.updatedAt) continue;
    byId.set(remote.id, { ...remote, deletedAt: null, cachedAt: now });
  }

  for (const id of tombstoned) byId.delete(id);

  // Renova a validade de todo sobrevivente: a sync confirmou que ele ainda existe.
  const survivors = [...byId.values()]
    .map((post) => ({ ...post, cachedAt: now }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const posts = survivors.slice(0, maxPosts);
  const kept = new Set(posts.map((post) => post.id));
  const droppedIds = local.filter((post) => !kept.has(post.id)).map((post) => post.id);

  return { posts, droppedIds };
}

// --- TTL ----------------------------------------------------------------------

/**
 * Passou da janela offline? Avaliado na LEITURA, não no merge — offline não há
 * merge nenhum, e é justamente offline que o TTL precisa valer.
 */
export function isExpired(post: Pick<Post, 'cachedAt'>, nowMs: number, ttlMs: number): boolean {
  return nowMs - Date.parse(post.cachedAt) > ttlMs;
}

/** Corte de `cachedAt` abaixo do qual o post não pode mais ser exibido. */
export function expiryCutoff(nowMs: number, ttlMs: number): IsoDate {
  return new Date(nowMs - ttlMs).toISOString();
}

export function visiblePosts(posts: readonly Post[], nowMs: number, ttlMs: number): Post[] {
  return posts.filter((post) => post.deletedAt === null && !isExpired(post, nowMs, ttlMs));
}
