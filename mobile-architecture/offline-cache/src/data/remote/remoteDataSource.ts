/**
 * Porta de rede. É o único lugar do app que "fala com o servidor" — e o único
 * que conhece o `MockServer`.
 *
 * Nada acima desta camada sabe que o servidor é fake: trocar por HTTP real é
 * escrever outra implementação desta interface.
 */

import type { RemotePost } from '../../domain';
import { MockServer, NetworkError, ServerError } from './mockServer';

export interface DeltaResponse {
  posts: RemotePost[];
  deleted: string[];
  cursor: string;
}

export interface LikeAck {
  likesCount: number;
  likedByMe: boolean;
}

export interface RemoteDataSource {
  /** `GET /feed?cursor=<iso>`. `cursor: null` = primeira carga (cache frio). */
  fetchDelta(cursor: string | null): Promise<DeltaResponse>;
  /**
   * `POST /posts/:id/like`. Recebe o estado desejado e a chave de idempotência
   * (o id da entrada do outbox), para que reenvio não dobre o contador.
   */
  sendLike(postId: string, liked: boolean, idempotencyKey: string): Promise<LikeAck>;
}

/** Erro de transporte (offline) vs erro do servidor: só o primeiro é "tente de novo já". */
export function isTransportError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export function describeError(error: unknown): string {
  if (error instanceof NetworkError || error instanceof ServerError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}

export class MockRemoteDataSource implements RemoteDataSource {
  constructor(private readonly server: MockServer) {}

  fetchDelta(cursor: string | null): Promise<DeltaResponse> {
    return this.server.getFeed(cursor);
  }

  sendLike(postId: string, liked: boolean, idempotencyKey: string): Promise<LikeAck> {
    return this.server.setLike(postId, liked, idempotencyKey);
  }
}
