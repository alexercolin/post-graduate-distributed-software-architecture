/**
 * Política de evicção do cache de binários: LRU com budget fixo.
 *
 * É o que garante o teto de 200 MB do RNF. Função pura — quem apaga arquivo é o
 * `ImageCache`, esta camada só decide o quê.
 */

export interface CacheEntry {
  /** Chave estável do item. Aqui, o id do post. */
  key: string;
  sizeBytes: number;
  /** Epoch ms do último acesso (leitura ou escrita). */
  lastAccessAt: number;
}

export interface EvictionPlan {
  /** Chaves a remover, das menos recentemente usadas para as mais recentes. */
  remove: string[];
  bytesBefore: number;
  bytesAfter: number;
  /** `false` quando nem removendo tudo o budget é atingido. */
  fitsBudget: boolean;
}

export interface EvictionInput {
  entries: readonly CacheEntry[];
  budgetBytes: number;
  /** Espaço a reservar para um download que ainda vai acontecer. */
  reserveBytes?: number;
  /** Itens que não podem sair agora (ex.: visíveis na tela). */
  protectedKeys?: ReadonlySet<string>;
}

/**
 * Remove do menos recentemente usado para cima até caber em
 * `budgetBytes - reserveBytes`.
 *
 * trade-off: LRU puro ignora "custo de recuperar". Um thumbnail evictado custa um
 * download pequeno, então errar aqui é barato — o que não seria verdade para um
 * cache de vídeo. `protectedKeys` existe para evitar o caso patológico de evictar
 * a imagem que está sendo pintada na tela neste instante.
 */
export function planEviction(input: EvictionInput): EvictionPlan {
  const { entries, budgetBytes, reserveBytes = 0, protectedKeys } = input;

  const bytesBefore = entries.reduce((total, entry) => total + entry.sizeBytes, 0);
  const target = budgetBytes - reserveBytes;

  let bytesAfter = bytesBefore;
  const remove: string[] = [];

  if (bytesAfter <= target) {
    return { remove, bytesBefore, bytesAfter, fitsBudget: true };
  }

  const candidates = entries
    .filter((entry) => !protectedKeys?.has(entry.key))
    .slice()
    // Empate de timestamp resolvido pela chave, para o plano ser determinístico.
    .sort((a, b) => a.lastAccessAt - b.lastAccessAt || a.key.localeCompare(b.key));

  for (const entry of candidates) {
    if (bytesAfter <= target) break;
    remove.push(entry.key);
    bytesAfter -= entry.sizeBytes;
  }

  return { remove, bytesBefore, bytesAfter, fitsBudget: bytesAfter <= target };
}

export function totalBytes(entries: readonly CacheEntry[]): number {
  return entries.reduce((total, entry) => total + entry.sizeBytes, 0);
}

export function toMegabytes(bytes: number): number {
  return bytes / (1024 * 1024);
}
