/**
 * `ImageCache` sem disco, para os testes de integração. Aplica a MESMA política
 * de evicção do domínio — o que muda é só onde os bytes moram.
 */

import { planEviction, toMegabytes, totalBytes, type CacheEntry } from '../../domain';
import type { CacheUsage, ImageCache, ThumbRequest } from './imageCache';

interface FakeItem {
  sizeBytes: number;
  lastAccessAt: number;
}

/** Espelha o `MAX_PARALLEL_DOWNLOADS` do cache real. */
const BATCH_SIZE = 4;

export class InMemoryImageCache implements ImageCache {
  private items = new Map<string, FakeItem>();
  private listeners = new Set<() => void>();
  private clock = 0;

  constructor(
    private readonly budgetBytes: number,
    /** Tamanho simulado de cada thumbnail baixado. */
    private readonly bytesPerItem: number = 64 * 1024,
    /** Chaves cujo download deve falhar, para exercitar o placeholder. */
    private readonly failing: ReadonlySet<string> = new Set(),
  ) {}

  async init(): Promise<void> {}

  getLocalUri(key: string): string | null {
    return this.items.has(key) ? `memory://thumbs/${key}.jpg` : null;
  }

  touch(keys: readonly string[]): void {
    for (const key of keys) {
      const item = this.items.get(key);
      if (item) item.lastAccessAt = ++this.clock;
    }
  }

  /** Mesmo formato do cache real: baixa em lotes e aplica o budget a cada lote. */
  async ensure(requests: readonly ThumbRequest[]): Promise<void> {
    const missing = requests.filter(
      (request) => !this.items.has(request.key) && !this.failing.has(request.key),
    );

    for (let index = 0; index < missing.length; index += BATCH_SIZE) {
      const batch = missing.slice(index, index + BATCH_SIZE);
      for (const request of batch) {
        this.items.set(request.key, { sizeBytes: this.bytesPerItem, lastAccessAt: ++this.clock });
      }

      const plan = planEviction({
        entries: this.entries(),
        budgetBytes: this.budgetBytes,
        protectedKeys: new Set(batch.map((request) => request.key)),
      });
      for (const key of plan.remove) this.items.delete(key);
    }

    this.emit();
  }

  async drop(keys: readonly string[]): Promise<void> {
    for (const key of keys) this.items.delete(key);
    this.emit();
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.emit();
  }

  usage(): CacheUsage {
    const bytes = totalBytes(this.entries());
    return {
      bytes,
      megabytes: toMegabytes(bytes),
      count: this.items.size,
      budgetBytes: this.budgetBytes,
      ratio: this.budgetBytes === 0 ? 1 : bytes / this.budgetBytes,
    };
  }

  entries(): CacheEntry[] {
    return [...this.items.entries()].map(([key, item]) => ({
      key,
      sizeBytes: item.sizeBytes,
      lastAccessAt: item.lastAccessAt,
    }));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
