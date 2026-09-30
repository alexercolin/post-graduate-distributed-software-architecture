/**
 * `LocalStore` em memória — usado pelos testes de integração, que rodam em Node
 * sem emulador.
 *
 * trade-off: o SQL de `DrizzleLocalStore` não é exercitado por teste automatizado
 * (expo-sqlite só existe dentro do runtime nativo). O que os testes provam é a
 * orquestração do repositório e do sync engine; a fidelidade do SQL fica coberta
 * pelos critérios de aceite manuais. Está declarado no relatório da Fase 6.
 */

import type { OutboxEntry, Post, PostId, SyncState } from '../../domain';
import type { LocalStore } from './localStore';

export class InMemoryLocalStore implements LocalStore {
  private posts = new Map<PostId, Post>();
  private outbox = new Map<string, OutboxEntry>();
  private sync = new Map<string, SyncState>();

  constructor(seed: readonly Post[] = []) {
    for (const post of seed) this.posts.set(post.id, post);
  }

  async listPosts(): Promise<Post[]> {
    return [...this.posts.values()].map((post) => ({ ...post }));
  }

  async applyMerge(next: readonly Post[], droppedIds: readonly PostId[]): Promise<void> {
    for (const id of droppedIds) this.posts.delete(id);
    for (const post of next) this.posts.set(post.id, { ...post });
  }

  async applyServerLike(postId: PostId, likesCount: number, likedByMe: boolean): Promise<void> {
    const post = this.posts.get(postId);
    if (post) this.posts.set(postId, { ...post, likesCount, likedByMe });
  }

  async listOutbox(): Promise<OutboxEntry[]> {
    return [...this.outbox.values()].map((entry) => ({ ...entry }));
  }

  async insertOutbox(entry: OutboxEntry): Promise<void> {
    this.outbox.set(entry.id, { ...entry });
  }

  async updateOutbox(entry: OutboxEntry): Promise<void> {
    this.outbox.set(entry.id, { ...entry });
  }

  async deleteOutbox(ids: readonly string[]): Promise<void> {
    for (const id of ids) this.outbox.delete(id);
  }

  async getSyncState(key: string): Promise<SyncState | null> {
    const state = this.sync.get(key);
    return state ? { ...state } : null;
  }

  async setSyncState(state: SyncState): Promise<void> {
    this.sync.set(state.key, { ...state });
  }

  async reset(): Promise<void> {
    this.posts.clear();
    this.outbox.clear();
    this.sync.clear();
  }
}
