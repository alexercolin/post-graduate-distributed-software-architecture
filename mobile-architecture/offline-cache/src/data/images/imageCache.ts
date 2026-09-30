/**
 * Porta do cache de binários.
 *
 * Segunda camada de persistência, separada do SQLite de propósito: metadados de
 * 500 posts custam KBs e vivem muito; 20 thumbnails custam MBs e são
 * descartáveis. Ciclos de vida diferentes, políticas de evicção diferentes.
 */

import type { CacheEntry } from '../../domain';

export interface CacheUsage {
  bytes: number;
  megabytes: number;
  count: number;
  budgetBytes: number;
  /** Fração do budget em uso — o número que a tela de debug mostra. */
  ratio: number;
}

export interface ThumbRequest {
  /** Id do post. É a chave do item no cache. */
  key: string;
  url: string;
}

export interface ImageCache {
  /** Reconcilia o índice com o que existe em disco. Idempotente. */
  init(): Promise<void>;
  /** URI local, ou `null` se não está em disco (nunca baixado ou evictado). */
  getLocalUri(key: string): string | null;
  /** Baixa o que falta e aplica a evicção para caber no budget. */
  ensure(requests: readonly ThumbRequest[]): Promise<void>;
  /** Marca acesso (LRU). Barato: só memória. */
  touch(keys: readonly string[]): void;
  /** Remove binários de posts que saíram do estado local. */
  drop(keys: readonly string[]): Promise<void>;
  clear(): Promise<void>;
  usage(): CacheUsage;
  entries(): CacheEntry[];
  /** Notifica a UI quando um thumbnail aparece ou some. */
  subscribe(listener: () => void): () => void;
}
