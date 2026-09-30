/**
 * Outbox: escritas locais que ainda não chegaram ao servidor.
 *
 * Camada de domínio: nada de I/O, React, Expo ou SQLite. Tudo aqui é função pura
 * e recebe `now` por parâmetro para ser testável sem relógio.
 */

export type OutboxKind = 'like' | 'unlike';

/**
 * `pending` — ainda vai ser tentada.
 * `dead`    — excedeu o teto de tentativas; não será mais enviada e deixa de
 *             influenciar o que o usuário vê (ver `deriveLikeState`).
 */
export type OutboxStatus = 'pending' | 'dead';

export interface OutboxEntry {
  /** Id gerado no cliente. Vai como chave de idempotência na requisição. */
  id: string;
  /** Id do post alvo. */
  entityId: string;
  kind: OutboxKind;
  /** ISO 8601. Define a ordem de drenagem. */
  createdAt: string;
  attempts: number;
  /** Epoch ms da última tentativa. Base do backoff. `null` se nunca tentou. */
  lastAttemptAt: number | null;
  lastError: string | null;
  status: OutboxStatus;
}

export interface RetryPolicy {
  readonly baseDelayMs: number;
  readonly factor: number;
  readonly maxDelayMs: number;
  readonly maxAttempts: number;
}

/**
 * Backoff exponencial com teto: base * factor^attempts, limitado a maxDelayMs.
 *
 * trade-off: sem jitter. Com um único usuário e um único servidor fake não há
 * thundering herd a evitar, e determinismo torna o teste legível. Em produção,
 * jitter seria obrigatório.
 */
export function backoffDelayMs(attempts: number, policy: RetryPolicy): number {
  if (attempts <= 0) return 0;
  const raw = policy.baseDelayMs * policy.factor ** (attempts - 1);
  return Math.min(raw, policy.maxDelayMs);
}

/** Uma entrada está pronta para ir quando está pendente e o backoff já venceu. */
export function isReadyToSend(entry: OutboxEntry, nowMs: number, policy: RetryPolicy): boolean {
  if (entry.status !== 'pending') return false;
  if (entry.lastAttemptAt === null) return true;
  return nowMs - entry.lastAttemptAt >= backoffDelayMs(entry.attempts, policy);
}

/**
 * As entradas que o push deve tentar agora, em ordem de criação.
 *
 * A ordem importa: `like` seguido de `unlike` no mesmo post precisa chegar nessa
 * sequência, senão o servidor termina no estado errado.
 */
export function selectSendable(
  entries: readonly OutboxEntry[],
  nowMs: number,
  policy: RetryPolicy,
): OutboxEntry[] {
  return entries
    .filter((entry) => isReadyToSend(entry, nowMs, policy))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Falha de envio: incrementa tentativas e mata a entrada ao bater o teto. */
export function recordFailure(
  entry: OutboxEntry,
  error: string,
  nowMs: number,
  policy: RetryPolicy,
): OutboxEntry {
  const attempts = entry.attempts + 1;
  return {
    ...entry,
    attempts,
    lastAttemptAt: nowMs,
    lastError: error,
    status: attempts >= policy.maxAttempts ? 'dead' : 'pending',
  };
}

/**
 * O que gravar no outbox quando o usuário toca no botão de curtir.
 *
 * Compactação: se já existe uma escrita pendente que ainda NÃO foi tentada e é o
 * oposto da nova, as duas se anulam — basta apagar a antiga e não enfileirar nada.
 * Curtir e descurtir cinco vezes offline vira zero requisição em vez de dez.
 *
 * A condição "nunca tentada" é essencial: se a requisição já saiu, não sabemos se
 * o servidor recebeu, então a escrita compensatória precisa ir de qualquer jeito.
 */
export function planEnqueue(
  existingForPost: readonly OutboxEntry[],
  next: OutboxEntry,
): { insert: OutboxEntry | null; deleteIds: string[] } {
  const cancellable = existingForPost
    .filter(
      (entry) =>
        entry.status === 'pending' && entry.attempts === 0 && entry.kind !== next.kind,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const opposite = cancellable[0];
  if (opposite) return { insert: null, deleteIds: [opposite.id] };

  return { insert: next, deleteIds: [] };
}

/**
 * Entradas cujo post não existe mais localmente (tombstone, TTL ou trim).
 *
 * Sem isso, curtir um post que foi deletado no servidor deixa lixo eterno no
 * outbox, tentando e falhando até morrer por tentativas.
 */
export function partitionOrphans(
  entries: readonly OutboxEntry[],
  existingPostIds: ReadonlySet<string>,
): { keep: OutboxEntry[]; orphans: OutboxEntry[] } {
  const keep: OutboxEntry[] = [];
  const orphans: OutboxEntry[] = [];
  for (const entry of entries) {
    (existingPostIds.has(entry.entityId) ? keep : orphans).push(entry);
  }
  return { keep, orphans };
}
