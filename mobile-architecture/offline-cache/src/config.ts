/**
 * Os números do requisito não funcional moram aqui — e só aqui.
 *
 * RNF: "visualizar os últimos 20 posts em thumbnail por até 7 dias sem conexão,
 * com indicação da última sincronização, consumindo no máximo 200 MB locais."
 *
 * Nenhum outro arquivo deve conter os literais 20, 7 ou 200.
 */

/** Quantos posts o feed local mantém. Acima disso, o mais antigo sai. */
export const MAX_POSTS = 20;

/** Janela de validade do cache offline, em dias, contada da última sync bem-sucedida. */
export const TTL_DAYS = 7;

/** Teto de armazenamento dos binários (thumbnails), em megabytes. */
export const CACHE_BUDGET_MB = 200;

// --- derivados ---------------------------------------------------------------

export const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;
export const CACHE_BUDGET_BYTES = CACHE_BUDGET_MB * 1024 * 1024;

/**
 * Política de retry do outbox.
 *
 * trade-off: backoff exponencial com teto de tentativas troca "a curtida sempre
 * chega" por "o app não fica tentando para sempre e gastando bateria". Ao bater o
 * teto a entrada vira `dead` e o estado otimista é revertido na UI — mentir menos
 * é preferível a insistir mais.
 */
export const RETRY_POLICY = {
  baseDelayMs: 2_000,
  factor: 2,
  maxDelayMs: 5 * 60 * 1000,
  maxAttempts: 5,
} as const;

/** Intervalo mínimo (minutos) da task periódica de background. O SO trata como sugestão. */
export const BACKGROUND_SYNC_MINUTES = 15;

/** Nome do arquivo SQLite e da pasta de binários. */
export const DATABASE_NAME = 'offline-feed.db';
export const IMAGE_CACHE_DIR = 'thumbs';

/** Chave única da linha de sync_state (só existe um feed neste escopo). */
export const FEED_SYNC_KEY = 'feed';
