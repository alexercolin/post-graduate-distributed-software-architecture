/**
 * Servidor fake, em memória, dentro do próprio app.
 *
 * Não é rede real de propósito: precisamos poder ligar latência, taxa de erro,
 * modo offline e deletar um post para demonstrar o caminho dos tombstones ao
 * vivo na apresentação. Um backend de verdade não daria esse controle.
 *
 * Contrato implementado:
 *   GET  /feed?cursor=<iso>  -> { posts, deleted, cursor }
 *   POST /posts/:id/like     -> { likesCount }   (idempotente)
 */

import type { RemotePost } from '../../domain';

export interface FeedResponse {
  posts: RemotePost[];
  deleted: string[];
  cursor: string;
}

export interface LikeResponse {
  likesCount: number;
  likedByMe: boolean;
}

export interface MockControls {
  /** Latência artificial por requisição, em ms. */
  latencyMs: number;
  /** Probabilidade [0..1] de a requisição falhar com erro de servidor. */
  errorRate: number;
  /** Simula "sem rede": toda requisição rejeita como falha de transporte. */
  offline: boolean;
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerError';
  }
}

interface ServerPost extends RemotePost {
  deletedAt: string | null;
}

const AUTHORS = ['ada', 'grace', 'linus', 'margaret', 'alan', 'barbara'];
const CAPTIONS = [
  'consistência eventual em ação',
  'cache quente, rede fria',
  'o outbox drenou',
  'tombstone chegou',
  'LRU trabalhando',
  'delta pequeno, feed inteiro',
];

/** Seeds fixos: a mesma imagem para o mesmo post em todo boot. */
function seedPosts(count: number, startMs: number): ServerPost[] {
  return Array.from({ length: count }, (_unused, index) => {
    const id = `post-${String(index + 1).padStart(3, '0')}`;
    const at = new Date(startMs - index * 3_600_000).toISOString();
    return {
      id,
      author: AUTHORS[index % AUTHORS.length] ?? 'anon',
      caption: `${CAPTIONS[index % CAPTIONS.length] ?? ''} #${index + 1}`,
      // Só os binários vêm da rede real — os metadados são 100% locais.
      imageUrl: `https://picsum.photos/seed/${id}/1080/1080`,
      thumbUrl: `https://picsum.photos/seed/${id}/400/400`,
      createdAt: at,
      updatedAt: at,
      likesCount: (index * 7) % 23,
      likedByMe: false,
      deletedAt: null,
    };
  });
}

export class MockServer {
  private readonly postsById = new Map<string, ServerPost>();

  readonly controls: MockControls = { latencyMs: 250, errorRate: 0, offline: false };

  constructor(options: { seedCount?: number; now?: number } = {}) {
    const now = options.now ?? Date.now();
    for (const post of seedPosts(options.seedCount ?? 24, now)) {
      this.postsById.set(post.id, post);
    }
  }

  // --- endpoints -------------------------------------------------------------

  async getFeed(cursor: string | null): Promise<FeedResponse> {
    await this.simulateTransport();

    // Comparação INCLUSIVA (`>=`), não exclusiva.
    // Com `>`, qualquer evento que aconteça no mesmo milissegundo do cursor
    // some para sempre — e é exatamente o caso de uma escrita logo após uma
    // sync. O preço é reentregar os eventos da borda: entrega ao-menos-uma-vez,
    // que o merge idempotente do domínio absorve sem efeito colateral.
    const all = [...this.postsById.values()];
    const changed = all.filter(
      (post) => post.deletedAt === null && (cursor === null || post.updatedAt >= cursor),
    );
    const deleted = all
      .filter((post) => post.deletedAt !== null && (cursor === null || post.deletedAt >= cursor))
      .map((post) => post.id);

    return {
      posts: changed
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(({ deletedAt: _deletedAt, ...post }) => post),
      deleted,
      cursor: new Date().toISOString(),
    };
  }

  /**
   * Idempotente por construção: o endpoint recebe o estado DESEJADO, não um
   * incremento. Reenviar "curtido = true" duas vezes deixa o contador igual, que
   * é exatamente o caso "a requisição saiu mas a resposta se perdeu".
   */
  async setLike(postId: string, liked: boolean, _idempotencyKey: string): Promise<LikeResponse> {
    await this.simulateTransport();

    const post = this.postsById.get(postId);
    if (!post || post.deletedAt !== null) {
      throw new ServerError(`404 post ${postId}`);
    }

    if (liked !== post.likedByMe) {
      post.likedByMe = liked;
      post.likesCount = Math.max(0, post.likesCount + (liked ? 1 : -1));
      post.updatedAt = new Date().toISOString();
    }

    return { likesCount: post.likesCount, likedByMe: post.likedByMe };
  }

  // --- controles de teste ----------------------------------------------------

  setLatency(ms: number): void {
    this.controls.latencyMs = ms;
  }

  setErrorRate(rate: number): void {
    this.controls.errorRate = Math.min(1, Math.max(0, rate));
  }

  setOffline(offline: boolean): void {
    this.controls.offline = offline;
  }

  /** Deleta um post "no servidor" para exercitar o caminho dos tombstones. */
  deletePost(postId: string): boolean {
    const post = this.postsById.get(postId);
    if (!post || post.deletedAt !== null) return false;
    post.deletedAt = new Date().toISOString();
    return true;
  }

  /** Publica um post novo, para demonstrar delta sync incremental. */
  publishPost(partial: Partial<RemotePost> = {}): RemotePost {
    const now = new Date().toISOString();
    const id = partial.id ?? `post-${now}`;
    const post: ServerPost = {
      id,
      author: partial.author ?? 'servidor',
      caption: partial.caption ?? 'post novo publicado no mock',
      imageUrl: partial.imageUrl ?? `https://picsum.photos/seed/${id}/1080/1080`,
      thumbUrl: partial.thumbUrl ?? `https://picsum.photos/seed/${id}/400/400`,
      createdAt: partial.createdAt ?? now,
      updatedAt: partial.updatedAt ?? now,
      likesCount: partial.likesCount ?? 0,
      likedByMe: partial.likedByMe ?? false,
      deletedAt: null,
    };
    this.postsById.set(id, post);
    const { deletedAt: _deletedAt, ...remote } = post;
    return remote;
  }

  /** Só para inspeção nos testes e na tela de debug. */
  peek(postId: string): RemotePost | null {
    const post = this.postsById.get(postId);
    if (!post) return null;
    const { deletedAt: _deletedAt, ...remote } = post;
    return remote;
  }

  private async simulateTransport(): Promise<void> {
    if (this.controls.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.controls.latencyMs));
    }
    if (this.controls.offline) {
      throw new NetworkError('sem conexão');
    }
    if (this.controls.errorRate > 0 && Math.random() < this.controls.errorRate) {
      throw new ServerError('500 falha simulada');
    }
  }
}
