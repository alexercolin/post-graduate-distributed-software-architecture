/** Estado de sincronização — o que torna a consistência eventual visível. */
export interface SyncState {
  /** Chave lógica do recurso sincronizado. Neste escopo existe só o feed. */
  key: string;
  /** Cursor do delta sync (ISO). `null` = nunca sincronizou: cache frio. */
  cursor: string | null;
  /** Quando a última sync terminou com sucesso. Alimenta o "atualizado há X". */
  lastSuccessAt: string | null;
}

export type SyncReason =
  | 'app-start'
  | 'foreground'
  | 'connectivity-restored'
  | 'background-task'
  | 'manual';

export interface SyncOutcome {
  ok: boolean;
  reason: SyncReason;
  /** Posts recebidos no delta. */
  pulled: number;
  /** Tombstones aplicados. */
  deleted: number;
  /** Entradas do outbox confirmadas pelo servidor. */
  pushed: number;
  /** Entradas que falharam nesta rodada (voltam ao backoff). */
  failed: number;
  /** Motivo da falha, quando `ok` é falso. */
  error: string | null;
  /** `true` quando outra sync já estava em andamento e esta foi descartada. */
  skipped: boolean;
}

export function emptyOutcome(reason: SyncReason): SyncOutcome {
  return {
    ok: true,
    reason,
    pulled: 0,
    deleted: 0,
    pushed: 0,
    failed: 0,
    error: null,
    skipped: false,
  };
}
