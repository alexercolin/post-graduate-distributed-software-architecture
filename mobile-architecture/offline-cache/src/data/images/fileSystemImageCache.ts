/**
 * Cache de thumbnails em disco, com budget explícito e evicção LRU.
 *
 * Por que não o cache automático do `expo-image`: ele não expõe tamanho em disco
 * nem permite impor um teto. Um RNF com número ("no máximo 200 MB") não pode
 * depender de um cache que a plataforma gerencia sozinha. `expo-image` continua
 * sendo usado — como componente de renderização, apontando para o arquivo local.
 *
 * Por que `Paths.document` e não `Paths.cache`: o sistema operacional pode
 * esvaziar o diretório de cache quando quiser, e era exatamente essa a alternativa
 * rejeitada no CLAUDE.md.
 * trade-off: o espaço passa a contar como dado do app (e entra em backup no iOS
 * se não for excluído explicitamente). É o preço de garantir a janela de 7 dias.
 */

import { Directory, File, Paths } from 'expo-file-system';

import { CACHE_BUDGET_BYTES, IMAGE_CACHE_DIR } from '../../config';
import { planEviction, toMegabytes, totalBytes, type CacheEntry } from '../../domain';
import type { CacheUsage, ImageCache, ThumbRequest } from './imageCache';

const MANIFEST_NAME = 'manifest.json';
const MAX_PARALLEL_DOWNLOADS = 4;

interface ManifestItem {
  sizeBytes: number;
  lastAccessAt: number;
  url: string;
}

interface Manifest {
  version: 1;
  items: Record<string, ManifestItem>;
}

export class FileSystemImageCache implements ImageCache {
  private readonly directory: Directory;
  private items = new Map<string, ManifestItem>();
  private listeners = new Set<() => void>();
  private manifestDirty = false;
  private inFlight = new Set<string>();
  private initialized = false;

  constructor(private readonly budgetBytes: number = CACHE_BUDGET_BYTES) {
    this.directory = new Directory(Paths.document, IMAGE_CACHE_DIR);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.directory.create({ intermediates: true, idempotent: true });
    this.loadManifest();
    this.reconcileWithDisk();
    this.initialized = true;
    this.emit();
  }

  getLocalUri(key: string): string | null {
    return this.items.has(key) ? this.fileFor(key).uri : null;
  }

  touch(keys: readonly string[]): void {
    const now = Date.now();
    let changed = false;
    for (const key of keys) {
      const item = this.items.get(key);
      if (item) {
        item.lastAccessAt = now;
        changed = true;
      }
    }
    // trade-off: o manifesto não é gravado a cada toque (seria I/O a cada frame).
    // Um crash perde os acessos da sessão: o LRU fica desatualizado, nunca errado.
    if (changed) this.manifestDirty = true;
  }

  async ensure(requests: readonly ThumbRequest[]): Promise<void> {
    await this.init();

    const missing = requests.filter(
      (request) => !this.items.has(request.key) && !this.inFlight.has(request.key),
    );
    for (const batch of chunk(missing, MAX_PARALLEL_DOWNLOADS)) {
      await Promise.all(batch.map((request) => this.download(request)));
      // Protege apenas o lote recém-baixado, não o pedido inteiro: se um pedido
      // maior que o budget protegesse tudo, a evicção nunca rodaria e o teto de
      // 200 MB deixaria de valer. Quando o pedido não cabe, os primeiros itens
      // saem e a UI mostra placeholder — o teto é o que não pode ser violado.
      await this.enforceBudget(new Set(batch.map((request) => request.key)));
    }

    this.flush();
    this.emit();
  }

  async drop(keys: readonly string[]): Promise<void> {
    let changed = false;
    for (const key of keys) {
      if (this.removeFile(key)) changed = true;
    }
    if (changed) {
      this.flush();
      this.emit();
    }
  }

  async clear(): Promise<void> {
    for (const key of [...this.items.keys()]) this.removeFile(key);
    this.items.clear();
    this.flush();
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

  // --- internals ---------------------------------------------------------------

  private fileFor(key: string): File {
    return new File(this.directory, `${key}.jpg`);
  }

  private async download(request: ThumbRequest): Promise<void> {
    this.inFlight.add(request.key);
    try {
      const file = this.fileFor(request.key);
      if (file.exists) file.delete();
      await File.downloadFileAsync(request.url, file, { idempotent: true });
      this.items.set(request.key, {
        sizeBytes: file.size,
        lastAccessAt: Date.now(),
        url: request.url,
      });
      this.manifestDirty = true;
    } catch {
      // Falha de download não é erro fatal: o item fica sem thumbnail e a UI
      // mostra o placeholder. A próxima sync tenta de novo.
    } finally {
      this.inFlight.delete(request.key);
    }
  }

  /**
   * trade-off: a evicção roda DEPOIS do download, então o uso pode ultrapassar o
   * teto por alguns instantes, no tamanho de um lote de thumbnails (~centenas de
   * KB). Reservar antes exigiria saber o tamanho do arquivo antes de baixá-lo.
   */
  private async enforceBudget(protectedKeys: ReadonlySet<string>): Promise<void> {
    const plan = planEviction({
      entries: this.entries(),
      budgetBytes: this.budgetBytes,
      protectedKeys,
    });
    if (plan.remove.length === 0) return;
    for (const key of plan.remove) this.removeFile(key);
    this.manifestDirty = true;
  }

  private removeFile(key: string): boolean {
    const existed = this.items.delete(key);
    try {
      const file = this.fileFor(key);
      if (file.exists) file.delete();
    } catch {
      // Arquivo já sumiu: o índice é a verdade, seguir em frente.
    }
    if (existed) this.manifestDirty = true;
    return existed;
  }

  private loadManifest(): void {
    const file = new File(this.directory, MANIFEST_NAME);
    if (!file.exists) return;
    try {
      const parsed = JSON.parse(file.textSync()) as Manifest;
      if (parsed.version !== 1) return;
      this.items = new Map(Object.entries(parsed.items));
    } catch {
      // Manifesto corrompido: reconstruir a partir do disco é sempre possível.
      this.items = new Map();
    }
  }

  /** O disco é a verdade sobre existência; o manifesto, sobre último acesso. */
  private reconcileWithDisk(): void {
    const onDisk = new Map<string, number>();
    for (const entry of this.directory.list()) {
      if (!(entry instanceof File) || entry.name === MANIFEST_NAME) continue;
      onDisk.set(entry.name.replace(/\.jpg$/, ''), entry.size);
    }

    for (const [key, item] of [...this.items]) {
      const size = onDisk.get(key);
      if (size === undefined) this.items.delete(key);
      else item.sizeBytes = size;
    }

    for (const [key, size] of onDisk) {
      if (!this.items.has(key)) {
        this.items.set(key, { sizeBytes: size, lastAccessAt: Date.now(), url: '' });
      }
    }

    this.manifestDirty = true;
  }

  private flush(): void {
    if (!this.manifestDirty) return;
    const manifest: Manifest = { version: 1, items: Object.fromEntries(this.items) };
    new File(this.directory, MANIFEST_NAME).write(JSON.stringify(manifest));
    this.manifestDirty = false;
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}
