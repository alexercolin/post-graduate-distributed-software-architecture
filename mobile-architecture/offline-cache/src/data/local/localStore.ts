/**
 * Porta de persistência de metadados.
 *
 * Sem regra de negócio aqui dentro: quem decide o que fazer é o domínio, o
 * `LocalStore` só lê e escreve. É uma interface (e não a classe Drizzle direto)
 * porque o teste de integração roda em Node, sem emulador, com a implementação
 * em memória.
 */

import type { OutboxEntry, Post, PostId, SyncState } from '../../domain';

export interface LocalStore {
  /** Todos os posts vivos, sem filtro de TTL — o filtro é do domínio. */
  listPosts(): Promise<Post[]>;
  /**
   * Aplica o resultado de um merge em uma única transação: o estado local nunca
   * fica meio atualizado se o app morrer no meio.
   */
  applyMerge(posts: readonly Post[], droppedIds: readonly PostId[]): Promise<void>;
  /** Reconcilia a contagem depois que o servidor confirmou uma curtida. */
  applyServerLike(postId: PostId, likesCount: number, likedByMe: boolean): Promise<void>;

  listOutbox(): Promise<OutboxEntry[]>;
  insertOutbox(entry: OutboxEntry): Promise<void>;
  updateOutbox(entry: OutboxEntry): Promise<void>;
  deleteOutbox(ids: readonly string[]): Promise<void>;

  getSyncState(key: string): Promise<SyncState | null>;
  setSyncState(state: SyncState): Promise<void>;

  /** Só para a tela de debug e para os testes. */
  reset(): Promise<void>;
}
